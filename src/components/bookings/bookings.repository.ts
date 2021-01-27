import { Inject, InRequestScope } from 'typescript-ioc';
import { InsertResult, SelectQueryBuilder } from 'typeorm';
import { Booking, BookingStatus } from '../../models';
import { RepositoryBase } from '../../core/repository';
import { ConcurrencyError } from '../../errors/concurrencyError';
import { UserContext } from '../../infrastructure/auth/userContext';
import { BookingQueryVisitorFactory } from './bookings.auth';
import { ServiceProvidersRepository } from '../serviceProviders/serviceProviders.repository';
import { groupByKeyLastValue } from '../../tools/collections';
import { andWhere } from '../../tools/queryConditions';

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
			);
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

	public async search(request: BookingSearchQuery): Promise<Booking[]> {
		const serviceCondition = request.serviceId ? 'booking."_serviceId" = :serviceId' : '';

		const serviceProviderCondition = request.serviceProviderId
			? 'booking."_serviceProviderId" = :serviceProviderId'
			: '';

		const statusesCondition =
			request.statuses && request.statuses.length > 0 ? 'booking."_status" IN (:...statuses)' : '';

		const citizenUinFinsCondition =
			request.citizenUinFins && request.citizenUinFins.length > 0
				? 'booking."_citizenUinFin" IN (:...citizenUinFins)'
				: '';

		const dateFromCondition = request.from ? 'booking."_endDateTime" > :from' : '';
		const dateToCondition = request.to ? 'booking."_startDateTime" < :to' : '';

		const createdFromCondition = request.fromCreatedAt ? 'createdlog."_timestamp" > :fromCreatedAt' : '';
		const createdToCondition = request.toCreatedAt ? 'createdlog."_timestamp" < :toCreatedAt' : '';

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
					serviceProviderId: request.serviceProviderId,
					from: request.from,
					to: request.to,
					fromCreatedAt: request.fromCreatedAt,
					toCreatedAt: request.toCreatedAt,
					statuses: request.statuses,
					citizenUinFins: request.citizenUinFins,
				},
				request,
			)
		).orderBy('booking._id', 'DESC');

		const entries = await query.getMany();
		await this.includeServiceProviders(entries);
		return entries;
	}
}

export type BookingSearchQuery = {
	from?: Date;
	to?: Date;
	fromCreatedAt?: Date;
	toCreatedAt?: Date;
	statuses?: BookingStatus[];
	serviceId?: number;
	serviceProviderId?: number;
	citizenUinFins?: string[];
	byPassAuth?: boolean;
};
