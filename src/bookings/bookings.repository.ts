import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { Inject, Singleton } from "typescript-ioc";
import { InsertResult, UpdateResult } from "typeorm";
import { DbConnection } from "../core/db.connection";
import { Booking } from "../models";

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
