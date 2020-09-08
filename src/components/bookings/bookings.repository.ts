import { Inject, InRequestScope } from 'typescript-ioc';
import { InsertResult, SelectQueryBuilder } from 'typeorm';
import { Booking } from '../../models';
import { QueryAccessType, RepositoryBase } from '../../core/repository';
import { UserContext } from '../../infrastructure/userContext.middleware';
import { BookingSearchRequest } from './bookings.apicontract';

@InRequestScope
export class BookingsRepository extends RepositoryBase<Booking> {
	@Inject
	private userContext: UserContext;

	constructor() {
		super(Booking);
	}

	public async getBooking(bookingId: number, accessType = QueryAccessType.Read): Promise<Booking> {
		const query = (await this.createQueryForUser(accessType))
			.leftJoinAndSelect('booking._serviceProvider', 'sp_relation')
			.leftJoinAndSelect('booking._service', 'service_relation')
			.where('booking."_id" = :id', { id: bookingId });

		return await query.getOne();
	}

	public async search(request: BookingSearchRequest, accessType: QueryAccessType): Promise<Booking[]> {
		const serviceCondition = request.serviceId ? 'booking."_serviceId" = :serviceId' : '';

		const serviceProviderCondition = request.serviceProviderId
			? 'booking."_serviceProviderId" = :serviceProviderId'
			: '';

		const statusesCondition = request.statuses ? 'booking."_status" IN (:...statuses)' : '';

		const citizenUinFinsCondition = request.citizenUinFins
			? 'booking."_citizenUinFin" IN (:...citizenUinFins)'
			: '';

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

	public async save(booking: Booking): Promise<InsertResult> {
		const repository = await this.getRepository();
		return repository.insert(booking);
	}

	public async update(booking: Booking): Promise<Booking> {
		const repository = await this.getRepository();
		return repository.save(booking);
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
}
