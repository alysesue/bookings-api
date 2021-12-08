import { SelectQueryBuilder } from 'typeorm';
import { Inject, InRequestScope } from 'typescript-ioc';
import { IPagedEntities } from '../../core/pagedEntities';
import { PagingHelper } from '../../core/paging';
import { RepositoryBase } from '../../core/repository';
import { ConcurrencyError } from '../../errors/concurrencyError';
import { UserContext } from '../../infrastructure/auth/userContext';
import { Booking, BookingStatus } from '../../models';
import { groupByKeyLastValue } from '../../tools/collections';
import { andWhere } from '../../tools/queryConditions';
import { ServiceProvidersRepository } from '../serviceProviders/serviceProviders.repository';
import { BookedSlotRepository } from './bookedSlot.repository';
import { BookingQueryVisitorFactory } from './bookings.auth';

@InRequestScope
export class BookingsRepository extends RepositoryBase<Booking> {
	@Inject
	private userContext: UserContext;
	@Inject
	private serviceProvidersRepostiory: ServiceProvidersRepository;
	@Inject
	private bookedSlotRepository: BookedSlotRepository;

	constructor() {
		super(Booking);
	}

	private async includeServiceProviders(entries: Booking[]): Promise<void> {
		const entriesWithSp = entries.filter((e) => !!e.serviceProviderId);
		const serviceProviderIds = entriesWithSp.map((e) => e.serviceProviderId);

		const serviceProviders = await this.serviceProvidersRepostiory.getServiceProviders({
			ids: serviceProviderIds,
			skipAuthorisation: true,
		});

		const providersById = groupByKeyLastValue(serviceProviders, (sp) => sp.id);
		for (const entry of entries) {
			entry.serviceProvider = entry.serviceProviderId ? providersById.get(entry.serviceProviderId) || null : null;
		}
	}

	private async createSelectQuery(
		queryFilters: string[],
		queryParams: {},
		options: {
			byPassAuth?: boolean;
		},
	): Promise<SelectQueryBuilder<Booking>> {
		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = await BookingQueryVisitorFactory.getBookingQueryVisitor(
			options.byPassAuth,
		).createUserVisibilityCondition(authGroups);

		const repository = await this.getRepository();
		return repository
			.createQueryBuilder('booking')
			.where(andWhere([userCondition, ...queryFilters]), { ...userParams, ...queryParams })
			.leftJoinAndSelect('booking._service', 'service_relation')
			.leftJoinAndSelect('service_relation._organisation', 'org_relation')
			.leftJoinAndSelect('service_relation._adminUsers', 'adminUser_relation')
			.leftJoinAndSelect('booking._onHoldRescheduleWorkflow', 'onHoldRescheduleWorkflow')
			.leftJoinAndMapOne(
				'booking._createdLog',
				'booking_change_log',
				'createdlog',
				'createdlog."_bookingId" = booking._id AND createdlog._action = 1',
			)
			.leftJoinAndSelect('booking._event', 'event')
			.leftJoinAndSelect('event._oneOffTimeslots', 'event_oneOffTimeslots')
			.leftJoinAndSelect('event_oneOffTimeslots._serviceProvider', 'event_oneOffTimeslots_serviceProvider')
			.leftJoinAndSelect('event._service', 'event_service');
	}

	public async getBooking(bookingId: number, options: { byPassAuth?: boolean } = {}): Promise<Booking> {
		const idCondition = 'booking."_id" = :id';

		const query = await this.createSelectQuery([idCondition], { id: bookingId }, options);
		let entry = await query.getOne();

		// [BOOKINGSG-2737] TO REVIEW after all backward compatibility issues with owner ID is fixed
		if (!entry) {
			const idCondition = 'booking."_id" = :id AND booking."_ownerId" IS NULL';
			const query = await this.createSelectQuery([idCondition], { id: bookingId }, { byPassAuth: true });
			entry = await query.getOne();
		}

		if (entry) {
			const bookedSlots = await this.bookedSlotRepository.getBookedSlotByBooking(bookingId);
			entry.bookedSlots = bookedSlots ? bookedSlots : [];
			await this.includeServiceProviders([entry]);
		}

		return entry;
	}

	public async getBookingByUUID(bookingUUID: string, options: { byPassAuth?: boolean } = {}): Promise<Booking> {
		const uuidCondition = 'booking."_uuid" = :bookingUUID';

		const query = await this.createSelectQuery([uuidCondition], { bookingUUID }, options);
		const entry = await query.getOne();
		if (entry) {
			await this.includeServiceProviders([entry]);
		}

		return entry;
	}

	public async insert(booking: Booking): Promise<Booking> {
		const repository = await this.getRepository();
		const bookingPromise = await repository.save(booking);

		return bookingPromise;
	}

	public async saveMultiple(booking: Booking[]): Promise<Booking[]> {
		if (!booking) return;
		const repository = await this.getRepository();
		return await repository.save(booking);
	}

	public async getBookingsByEventId(eventId: number): Promise<Booking[]> {
		const idCondition = 'booking."_eventId" = :id';

		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder('booking')
			.where(andWhere([idCondition]), { id: eventId })
			.leftJoinAndSelect('booking._service', 'service')
			.leftJoinAndSelect('booking._event', 'event')
			.leftJoinAndSelect('booking.bookedSlots', 'bookedSlots')
			.leftJoinAndSelect('bookedSlots._oneOffTimeslot', 'oneOffTimeSlot')
			.leftJoinAndSelect('oneOffTimeSlot._serviceProvider', 'serviceProvider')
			.leftJoinAndSelect('serviceProvider._service', 'serviceProvider_service');

		return query.getMany();
	}

	public async update(booking: Booking): Promise<Booking> {
		const versionUpdated = await this.updateBookingVersion(booking);
		if (!versionUpdated) {
			throw new ConcurrencyError(`Booking ${booking.id} has changed in a parallel operation. Please try again.`);
		}

		const repository = await this.getRepository();
		return await repository.save(booking);
	}

	private async updateBookingVersion(booking: Booking): Promise<boolean> {
		const repository = await this.getRepository();

		// atomic increment DB operation
		const result = await repository.query(
			'update public.booking set _version = _version + 1 where _id = $1 and _version = $2',
			[booking.id, booking._version],
		);
		const [, affected] = result as [any, number];
		const incremented = affected > 0;

		if (incremented) {
			booking._version++;
		}

		return incremented;
	}

	public async search(request: BookingSearchQuery): Promise<IPagedEntities<Booking>> {
		const query = await this.searchQueryFormulation(request);

		const result = await PagingHelper.getManyWithPaging(query, 'booking._id', request);
		result.entries.map(async (booking) => {
			booking.bookedSlots = await this.bookedSlotRepository.getBookedSlotByBooking(booking.id);
		});

		await this.includeServiceProviders(result.entries);
		return result;
	}

	public async searchReturnAll(request: BookingSearchQuery): Promise<Booking[]> {
		const query = await this.searchQueryFormulation(request);

		const result = await query.getMany();

		await this.includeServiceProviders(result);
		return result;
	}

	private async searchQueryFormulation(request: BookingSearchQuery): Promise<SelectQueryBuilder<Booking>> {
		const serviceCondition = request.serviceId ? 'booking."_serviceId" = :serviceId' : '';

		const eventCondition =
			request.eventIds && request.eventIds.length > 0 ? 'booking."_eventId" IN (:...eventIds)' : '';

		const serviceProviderCondition =
			request.serviceProviderIds && request.serviceProviderIds.length > 0
				? 'booking."_serviceProviderId" IN (:...serviceProviderIds)'
				: '';

		const statusesCondition =
			request.statuses && request.statuses.length > 0 ? 'booking."_status" IN (:...statuses)' : '';

		const citizenUinFinsCondition =
			request.citizenUinFins && request.citizenUinFins.length > 0
				? 'booking."_citizenUinFin" IN (:...citizenUinFins)'
				: '';

		const dateFromCondition = request.from ? 'booking."_endDateTime" > :from' : '';
		const dateToCondition = request.to ? 'booking."_startDateTime" < :to' : '';

		const createdFromCondition = request.fromCreatedDate ? 'createdlog."_timestamp" > :fromCreatedDate' : '';
		const createdToCondition = request.toCreatedDate ? 'createdlog."_timestamp" < :toCreatedDate' : '';

		const bookingTokenCondition = request.bookingToken ? 'booking."_uuid" = :bookingToken' : '';

		const query = (
			await this.createSelectQuery(
				[
					serviceCondition,
					serviceProviderCondition,
					dateFromCondition,
					dateToCondition,
					createdFromCondition,
					createdToCondition,
					statusesCondition,
					citizenUinFinsCondition,
					eventCondition,
					bookingTokenCondition,
				],
				{
					serviceId: request.serviceId,
					serviceProviderIds: request.serviceProviderIds,
					from: request.from,
					to: request.to,
					fromCreatedDate: request.fromCreatedDate,
					toCreatedDate: request.toCreatedDate,
					statuses: request.statuses,
					citizenUinFins: request.citizenUinFins,
					eventIds: request.eventIds,
					bookingToken: request.bookingToken,
				},
				request,
			)
		).orderBy('booking._id', 'DESC');

		return query;
	}
}

export type BookingSearchQuery = {
	from?: Date;
	to?: Date;
	fromCreatedDate?: Date;
	toCreatedDate?: Date;
	statuses?: BookingStatus[];
	serviceId?: number;
	serviceProviderIds?: number[];
	citizenUinFins?: string[];
	byPassAuth?: boolean;
	page: number;
	limit: number;
	maxId?: number;
	eventIds?: number[];
	bookingToken?: string;
};
