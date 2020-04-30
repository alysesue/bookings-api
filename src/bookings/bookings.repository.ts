import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { Inject, Singleton } from "typescript-ioc";

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
      logger.error("usersRepository::getBookings::error", e);
    }
  }

  public async save(booking: Booking): Promise<Booking> {
    const conn = await this.connection.getConnection();
    conn
      .getRepository(Booking)
      .insert(booking)
      .then((res) => {
        return res;
      });
    return null;
  }
}
