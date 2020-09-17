import { Inject, InRequestScope } from 'typescript-ioc';
import { InsertResult } from 'typeorm';
import { Booking, BookingStatus } from '../../models';
import { RepositoryBase } from '../../core/repository';
import { ConcurrencyError } from '../../errors/ConcurrencyError';
import { UserContext } from '../../infrastructure/auth/userContext';
import { BookingQueryAuthVisitor } from './bookings.auth';

@InRequestScope
export class BookingsRepository extends RepositoryBase<Booking> {
	@Inject
	private userContext: UserContext;

	constructor() {
		super(Booking);
	}

	public async getBooking(bookingId: number): Promise<Booking> {
		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = await new BookingQueryAuthVisitor(
			'booking',
			'service_relation',
		).createUserVisibilityCondition(authGroups);
		const idCondition = 'booking."_id" = :id';

		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder('booking')
			.where([userCondition, idCondition].filter((c) => c).join(' AND '), { ...userParams, id: bookingId })
			.leftJoinAndSelect('booking._serviceProvider', 'sp_relation')
			.leftJoinAndSelect('booking._service', 'service_relation');

		return await query.getOne();
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
		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = await new BookingQueryAuthVisitor(
			'booking',
			'service_relation',
		).createUserVisibilityCondition(authGroups);

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

		const dateRangeCondition = '(booking."_startDateTime" < :to AND booking."_endDateTime" > :from)';

		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder('booking')
			.where(
				[
					userCondition,
					serviceCondition,
					serviceProviderCondition,
					dateRangeCondition,
					statusesCondition,
					citizenUinFinsCondition,
				]
					.filter((c) => c)
					.map((c) => `(${c})`)
					.join(' AND '),
				{
					...userParams,
					serviceId: request.serviceId,
					serviceProviderId: request.serviceProviderId,
					from: request.from,
					to: request.to,
					statuses: request.statuses,
					citizenUinFins: request.citizenUinFins,
				},
			)
			.leftJoinAndSelect('booking._serviceProvider', 'sp_relation')
			.leftJoinAndSelect('booking._service', 'service_relation')
			.orderBy('booking._id', 'DESC');

		return await query.getMany();
	}
}

export type BookingSearchQuery = {
	from: Date;
	to: Date;
	statuses?: BookingStatus[];
	serviceId?: number;
	serviceProviderId?: number;
	citizenUinFins?: string[];
};
