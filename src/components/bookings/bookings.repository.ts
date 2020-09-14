import { Inject, InRequestScope } from 'typescript-ioc';
import { InsertResult, SelectQueryBuilder } from 'typeorm';
import { Booking, BookingStatus } from '../../models';
import { QueryAccessType, RepositoryBase } from '../../core/repository';
import { UserContext } from '../../infrastructure/userContext.middleware';
import { ConcurrencyError } from '../../errors/ConcurrencyError';

@InRequestScope
export class BookingsRepository extends RepositoryBase<Booking> {
	@Inject
	private userContext: UserContext;

	constructor() {
		super(Booking);
	}

	private async createQueryForUser(_accessType: QueryAccessType): Promise<SelectQueryBuilder<Booking>> {
		const user = await this.userContext.getCurrentUser();

		const repository = await this.getRepository();
		let query = repository.createQueryBuilder('booking');
		if (user.isCitizen()) {
			query = query.where('booking."_citizenUinFin" = :uinfin', { uinfin: user.singPassUser.UinFin });
		}

		return query;
	}

	public async getBooking(bookingId: number, accessType = QueryAccessType.Read): Promise<Booking> {
		const query = (await this.createQueryForUser(accessType))
			.leftJoinAndSelect('booking._serviceProvider', 'sp_relation')
			.leftJoinAndSelect('booking._service', 'service_relation')
			.where('booking."_id" = :id', { id: bookingId });

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

	public async search(request: BookingSearchQuery, accessType: QueryAccessType): Promise<Booking[]> {
		const serviceCondition = request.serviceId ? 'booking."_serviceId" = :serviceId' : '';

		const serviceProviderCondition = request.serviceProviderId
			? 'booking."_serviceProviderId" = :serviceProviderId'
			: '';

		const statusesCondition = request.statuses ? 'booking."_status" IN (:...statuses)' : '';

		const citizenUinFinsCondition = '';

		const dateRangeCondition = '(booking."_startDateTime" < :to AND booking."_endDateTime" > :from)';

		const query = (await this.createQueryForUser(accessType))
			.where(
				[
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
