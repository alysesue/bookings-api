import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { Inject, Singleton } from "typescript-ioc";
import { InsertResult } from "typeorm";
import { DbConnection } from "../core/db.connection";
import { Booking } from "../models/index";

@Singleton
export class BookingsRepository {
  @Inject
  private connection: DbConnection;

  public async getBookings(): Promise<Booking[]> {
    try {
      const conn = await this.connection.getConnection();
      return conn.getRepository(Booking).find();
    } catch (e) {
      logger.error("bookingsRepository::getBookings::error", e);
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
}
