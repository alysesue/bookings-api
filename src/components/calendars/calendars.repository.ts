import { logger } from 'mol-lib-common/debugging/logging/LoggerV2';
import { Inject, Singleton } from 'typescript-ioc';

import { DbConnection } from '../../core/db.connection';
import { Calendar } from '../../models/calendar';
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
		return (await this.getRepository()).find();
	}

	public async getCalendarByUUID(uuid: string): Promise<Calendar> {
		return (await this.getRepository()).findOne({ uuid });
	}

	public async saveCalendar(calendar: Calendar): Promise<Calendar> {
		return (await this.getRepository()).save(calendar);
	}
}
