import { logger } from 'mol-lib-common/debugging/logging/LoggerV2';
import { Inject, Singleton } from 'typescript-ioc';

import { DbConnection } from '../core/db.connection';
import { Calendar } from '../models/calendar';
import { Repository } from "typeorm";

@Singleton
export class CalendarsRepository {
	@Inject
	private connection: DbConnection;

	private async getRepository(): Promise<Repository<Calendar>> {
		const conn = await this.connection.getConnection();
		return conn.getRepository(Calendar);
	}

	public async getCalendars(): Promise<Calendar[]> {
		try {
			return (await this.getRepository()).find();
		} catch (e) {
			logger.error('calendarsRepository::getCalendars::error', e);
			throw e;
		}
	}

	public async saveCalendar(calendar: Calendar): Promise<Calendar> {
		try {
			return (await this.getRepository()).save(calendar);
		} catch (e) {
			logger.error('calendarsRepository::addCalendar::error', e);
			throw e;
		}
	}
}
