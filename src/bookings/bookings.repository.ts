import { InRequestScope } from "typescript-ioc";
import { Between, FindConditions, FindManyOptions, InsertResult } from "typeorm";
import { Booking } from "../models";
import { RepositoryBase } from "../core/repository";

@InRequestScope
export class BookingsRepository extends RepositoryBase<Booking> {
	constructor() {
		super(Booking);
	}

	public async getBookings(serviceId?: number): Promise<Booking[]> {
		const findConditions: FindConditions<Booking> = {};
		if (serviceId) {
			findConditions['_serviceId'] = serviceId;
		}

		const findManyOptions: FindManyOptions<Booking> = { where: [findConditions] };
		findManyOptions['order'] = {};
		findManyOptions['order']['_id'] = 'DESC';

		return (await this.getRepository()).find(findManyOptions);
	}

	public async getBooking(id: string): Promise<Booking> {
		const repository = await this.getRepository();
		return repository.findOne(id);
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

		const findManyOptions: FindManyOptions<Booking> = { where: [findConditions] };
		findManyOptions['order'] = {};
		findManyOptions['order']['_id'] = 'DESC';

		return repository.find(findManyOptions);
	}
}
