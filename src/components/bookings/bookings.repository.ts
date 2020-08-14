import { InRequestScope } from "typescript-ioc";
import { InsertResult } from "typeorm";
import { Booking, BookingStatus } from "../../models";
import { RepositoryBase } from "../../core/repository";

@InRequestScope
export class BookingsRepository extends RepositoryBase<Booking> {
	constructor() {
		super(Booking);
	}

	public async getBooking(id: number): Promise<Booking> {
		const repository = await this.getRepository();
		return repository.findOne(id, { relations: ['_service', '_serviceProvider'] });
	}

	public async save(booking: Booking): Promise<InsertResult> {
		const repository = await this.getRepository();
		return repository.insert(booking);
	}

	public async update(booking: Booking): Promise<Booking> {
		const repository = await this.getRepository();
		return repository.save(booking);
	}

	public async search({ serviceId, serviceProviderId, statuses, from, to }:
		{
			serviceId?: number,
			serviceProviderId?: number,
			statuses?: BookingStatus[],
			from: Date,
			to: Date,
		}): Promise<Booking[]> {

		const serviceCondition = serviceId ? 'booking."_serviceId" = :serviceId' : '';

		const serviceProviderCondition = serviceProviderId ? 'booking."_serviceProviderId" = :serviceProviderId' : '';

		const statusesCondition = statuses ? 'booking."_status" IN (:...statuses)' : '';

		const dateRangeCondition = '(booking."_startDateTime" < :to AND booking."_endDateTime" > :from)';

		const repository = await this.getRepository();
		const query = repository.createQueryBuilder("booking")
			.where([serviceCondition, serviceProviderCondition, dateRangeCondition, statusesCondition].filter(c => c).join(' AND '),
				{ serviceId, serviceProviderId, from, to, statuses })
			.leftJoinAndSelect("booking._serviceProvider", "sp_relation")
			.leftJoinAndSelect("booking._service", "service_relation")
			.orderBy("booking._id", "DESC");

		return await query.getMany();
	}
}
