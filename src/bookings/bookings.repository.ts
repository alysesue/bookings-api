import { InRequestScope } from "typescript-ioc";
import { Between, FindConditions, FindManyOptions, InsertResult } from "typeorm";
import { Booking } from "../models";
import { RepositoryBase } from "../core/repository";

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

	public async search(searchRequest: {
		serviceId?: number,
		serviceProviderId?: number,
		status?: number,
		from: Date,
		to: Date
	}): Promise<Booking[]> {
		const repository = await this.getRepository();

		const findConditions: FindConditions<Booking> = {};
		findConditions['_startDateTime'] = Between(searchRequest.from, searchRequest.to);
		if (searchRequest.status) {
			findConditions['_status'] = searchRequest.status;
		}
		if (searchRequest.serviceId) {
			findConditions['_serviceId'] = searchRequest.serviceId;
		}
		if (searchRequest.serviceProviderId) {
			findConditions['_serviceProviderId'] = searchRequest.serviceProviderId;
		}

		const findManyOptions: FindManyOptions<Booking> = { where: [findConditions], relations: ['_service', '_serviceProvider'] };
		findManyOptions['order'] = {};
		findManyOptions['order']['_id'] = 'DESC';

		return repository.find(findManyOptions);
	}
}
