import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { Inject, Singleton } from "typescript-ioc";
import { Equal, FindManyOptions, InsertResult, LessThanOrEqual, MoreThanOrEqual, Raw, UpdateResult } from "typeorm";
import { DbConnection } from "../core/db.connection";
import { Booking, BookingStatus } from "../models";

@Singleton
export class BookingsRepository {
	@Inject
	private connection: DbConnection;

	private getFindConditions(filter?: BookingQueryFilter): FindManyOptions<Booking> {
		const conditions = { where: {} };
		if (filter === null || filter === undefined) {
			return conditions;
		}

		let rawStartDateTime = "";
		if (!!filter.minStartDateTime) {
			rawStartDateTime = `_startDateTime >= ${JSON.stringify(filter.minStartDateTime)}`;
		}

		if (!!filter.maxStartDateTime) {
			const maxStartDateTimeCondition = `_startDateTime <= ${JSON.stringify(filter.maxStartDateTime)}`;
			rawStartDateTime = rawStartDateTime.length === 0 ? maxStartDateTimeCondition
				: `${rawStartDateTime} AND ${maxStartDateTimeCondition}`;
		}

		if (rawStartDateTime.length > 0) {
			conditions.where["_startDateTime"] = Raw(rawStartDateTime);
		}

		if (!!filter.status) {
			conditions.where["_status"] = Equal(filter.status);
		}

		return conditions;
	}

	public async getBookings(filter?: BookingQueryFilter): Promise<Booking[]> {
		try {
			const conn = await this.connection.getConnection();
			const conditions = this.getFindConditions(filter);
			return conn.getRepository(Booking).find(conditions);
		} catch (e) {
			logger.error("bookingsRepository::getBookings::error", e);
			throw e;
		}
	}

	public async getBooking(id: string): Promise<Booking> {
		try {
			const conn = await this.connection.getConnection();
			return conn.getRepository(Booking).findOne(id);
		} catch (e) {
			logger.error("bookingsRepository::getBooking::error", e);
			throw e;
		}
	}

	public async save(booking: Booking): Promise<InsertResult> {
		try {
			const conn = await this.connection.getConnection();
			return conn.getRepository(Booking).insert(booking);
		} catch (e) {
			logger.error("bookingsRepository::saveBooking::error", e);
			throw e;
		}
	}

	public async update(booking: Booking): Promise<UpdateResult> {
		try {
			const conn = await this.connection.getConnection();
			return conn.getRepository(Booking).update(booking.id, booking);
		} catch (e) {
			logger.error("bookingsRepository::updateBooking::error", e);
			throw e;
		}
	}
}

export class BookingQueryFilter {
	public minStartDateTime?: Date;
	public maxStartDateTime?: Date;
	public status?: BookingStatus;
}
