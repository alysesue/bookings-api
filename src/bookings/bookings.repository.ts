import { Singleton } from "typescript-ioc";
import { Between, FindConditions, InsertResult } from "typeorm";
import { Booking } from "../models";
import { BookingSearchRequest } from "./bookings.apicontract";
import { RepositoryBase } from "../core/repository";


@Singleton
export class BookingsRepository extends RepositoryBase {
	public async getBookings(): Promise<Booking[]> {
		return (await this.getRepository<Booking>()).find();
	}

	public async getBooking(id: string): Promise<Booking> {
		const repository = await this.getRepository<Booking>();
		return repository.findOne(id);
	}

	public async save(booking: Booking): Promise<InsertResult> {
		const repository = await this.getRepository<Booking>();
		return repository.insert(booking);
	}

	public async update(booking: Booking): Promise<Booking> {
		const repository = await this.getRepository<Booking>();
		return repository.save(booking);
	}

	public async search(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		const repository = await this.getRepository<Booking>();

		const findConditions: FindConditions<Booking> = {};
		findConditions['_startDateTime'] = Between(searchRequest.from, searchRequest.to);
		if (searchRequest.status) {
			findConditions['_status'] = searchRequest.status;
		}

		return repository.find({where: [findConditions]});
	}
}
