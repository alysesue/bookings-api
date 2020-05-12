import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { Inject, Singleton } from "typescript-ioc";
import { Between, InsertResult, Repository, UpdateResult } from "typeorm";
import { DbConnection } from "../core/db.connection";
import { Booking } from "../models";
import { BookingSearchRequest } from "./bookings.apicontract";

@Singleton
export class BookingsRepository {
	@Inject
	private connection: DbConnection;

	public async getBookings(): Promise<Booking[]> {
		const repository = await this.getRepository();
		return repository.find();
	}

	public async getBooking(id: string): Promise<Booking> {
		const repository = await this.getRepository();
		return repository.findOne(id);
	}

	public async save(booking: Booking): Promise<InsertResult> {
		const repository = await this.getRepository();
		return repository.insert(booking);
	}

	public async update(booking: Booking): Promise<UpdateResult> {
		const repository = await this.getRepository();
		return repository.update(booking.id, booking);

	}

	public async search(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		const repository = await this.getRepository();

		return repository.find({
			where: [{
				_status: searchRequest.status,
				_startDateTime: Between(searchRequest.from, searchRequest.to)
			}]
		});
	}

	private async getRepository(): Promise<Repository<Booking>> {
		try {
			const conn = await this.connection.getConnection();
			return conn.getRepository(Booking);
		} catch (e) {
			logger.error("bookingsRepository::connection::error", e);
			throw e;
		}
	}
}
