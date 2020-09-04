import { Inject, InRequestScope } from 'typescript-ioc';
import { InsertResult, SelectQueryBuilder } from 'typeorm';
import { Booking, BookingStatus } from '../../models';
import { QueryAccessType, RepositoryBase } from '../../core/repository';
import { UserContext } from '../../infrastructure/userContext.middleware';

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

	public async save(booking: Booking): Promise<InsertResult> {
		const repository = await this.getRepository();
		return repository.insert(booking);
	}

	public async update(booking: Booking): Promise<Booking> {
		const repository = await this.getRepository();
		return repository.save(booking);
	}

	public async search({
		serviceId,
		serviceProviderId,
		statuses,
		citizenUinFins,
		from,
		to,
		accessType,
	}: {
		serviceId?: number;
		serviceProviderId?: number;
		statuses?: BookingStatus[];
		citizenUinFins?: string[];
		from: Date;
		to: Date;
		accessType: QueryAccessType;
	}): Promise<Booking[]> {
		const serviceCondition = serviceId ? 'booking."_serviceId" = :serviceId' : '';

		const serviceProviderCondition = serviceProviderId ? 'booking."_serviceProviderId" = :serviceProviderId' : '';

		const statusesCondition = statuses ? 'booking."_status" IN (:...statuses)' : '';

		const citizenUinFinsCondition = citizenUinFins ? 'booking."_citizenUinFin" IN (:...citizenUinFins)' : '';

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
					.join(' AND '),
				{ serviceId, serviceProviderId, from, to, statuses, citizenUinFins },
			)
			.leftJoinAndSelect('booking._serviceProvider', 'sp_relation')
			.leftJoinAndSelect('booking._service', 'service_relation')
			.orderBy('booking._id', 'DESC');

		return await query.getMany();
	}
}
