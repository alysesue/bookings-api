import { logger } from 'mol-lib-common/debugging/logging/LoggerV2';
import { Inject, Singleton } from 'typescript-ioc';

import { DbConnection } from '../core/db.connection';
import { Booking } from '../entities/booking';

@Singleton
export class BookingsRepository {

	@Inject
	private connection: DbConnection;

	public async getBookings(): Promise<Booking[]> {
		try {
			const conn = await this.connection.getConnection();
			return conn.getRepository(Booking).find();
		} catch (e) {
			logger.error('usersRepository::getBookings::error', e);
		}
	}
}
