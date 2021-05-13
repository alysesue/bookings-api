import { Inject, InRequestScope } from 'typescript-ioc';
import { InsertResult, SelectQueryBuilder } from 'typeorm';
import { Booking, BookingStatus } from '../../models';
import { RepositoryBase } from '../../core/repository';
import { ConcurrencyError } from '../../errors/concurrencyError';
import { UserContext } from '../../infrastructure/auth/userContext';
import { ServiceProvidersRepository } from '../serviceProviders/serviceProviders.repository';
import { groupByKeyLastValue } from '../../tools/collections';
import { andWhere } from '../../tools/queryConditions';
import { PagingHelper } from '../../core/paging';
import { IPagedEntities } from '../../core/pagedEntities';
import { BookingQueryVisitorFactory } from './bookings.auth';

@InRequestScope
export class BookingsRepository extends RepositoryBase<Booking> {
	@Inject
	private userContext: UserContext;
	@Inject
	private serviceProvidersRepostiory: ServiceProvidersRepository;

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
			.leftJoinAndMapOne(
				'booking._createdLog',
				'booking_change_log',
				'createdlog',
				'createdlog."_bookingId" = booking._id AND createdlog._action = 1',
			)
			.leftJoinAndSelect('service_relation._organisation', 'org_relation');
	}

	public async getBooking(bookingId: number): Promise<Booking> {
		const idCondition = 'booking."_id" = :id';

		const query = await this.createSelectQuery([idCondition], { id: bookingId }, {});
		const entry = await query.getOne();
		if (entry) {
			await this.includeServiceProviders([entry]);
		}

		return entry;
	}

	public async insert(booking: Booking): Promise<InsertResult> {
		const repository = await this.getRepository();
		return await repository.insert(booking);
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
		const serviceCondition = request.serviceId ? 'booking."_serviceId" = :serviceId' : '';

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
				},
				request,
			)
		).orderBy('booking._id', 'DESC');

		const result = await PagingHelper.getManyWithPaging(query, 'booking._id', request);
		await this.includeServiceProviders(result.entries);
		return result;
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
};

export type PagedEntities<T> = {
	data: T[];
	total: number;
	page: number;
};
