import { Inject, InRequestScope } from 'typescript-ioc';
import { FindConditions, SelectQueryBuilder } from 'typeorm';
import { Booking, BookingStatus } from '../../models';
import { QueryAccessType, RepositoryBase } from '../../core/repository';
import { UserContext } from '../../infrastructure/userContext.middleware';
import { BookingUpdateConcurrencyError } from '../../errors/BookingUpdateConcurrencyError';

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

	public async getBooking(id: number, accessType = QueryAccessType.Read): Promise<Booking> {
		const query = (await this.createQueryForUser(accessType))
			.leftJoinAndSelect('booking._serviceProvider', 'sp_relation')
			.leftJoinAndSelect('booking._service', 'service_relation');

		return await query.getOne();
	}

	public async save(booking: Booking): Promise<void> {
		const repository = await this.getRepository();

		if (!booking.id) {
			await repository.insert(booking);
			return;
		}

		const versionUpdated = await this.updateBookingVersion(booking);
		if (!versionUpdated) {
			throw new BookingUpdateConcurrencyError(
				`Booking ${booking.id} has changed in a parallel operation. Please try again.`,
			);
		}

		await repository.save(booking);
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

	public async search({
		serviceId,
		serviceProviderId,
		statuses,
		from,
		to,
		accessType,
	}: {
		serviceId?: number;
		serviceProviderId?: number;
		statuses?: BookingStatus[];
		from: Date;
		to: Date;
		accessType: QueryAccessType;
	}): Promise<Booking[]> {
		const serviceCondition = serviceId ? 'booking."_serviceId" = :serviceId' : '';

		const serviceProviderCondition = serviceProviderId ? 'booking."_serviceProviderId" = :serviceProviderId' : '';

		const statusesCondition = statuses ? 'booking."_status" IN (:...statuses)' : '';

		const dateRangeCondition = '(booking."_startDateTime" < :to AND booking."_endDateTime" > :from)';

		const query = (await this.createQueryForUser(accessType))
			.where(
				[serviceCondition, serviceProviderCondition, dateRangeCondition, statusesCondition]
					.filter((c) => c)
					.join(' AND '),
				{ serviceId, serviceProviderId, from, to, statuses },
			)
			.leftJoinAndSelect('booking._serviceProvider', 'sp_relation')
			.leftJoinAndSelect('booking._service', 'service_relation')
			.orderBy('booking._id', 'DESC');

		return await query.getMany();
	}
}
