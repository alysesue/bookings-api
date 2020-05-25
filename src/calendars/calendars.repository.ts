import { Inject, Singleton } from 'typescript-ioc';

import { DbConnection } from '../core/db.connection';
import { Calendar } from '../models';
import { Repository } from "typeorm";

@Singleton
export class CalendarsRepository {
	@Inject
	private connection: DbConnection;

	public async getCalendars(): Promise<Calendar[]> {
		return (await this.getRepository()).find();
	}

	public async getCalendarsWithTemplates(): Promise<Calendar[]> {
		return (await this.getRepository()).find({ relations: ['schedules'] });
	}

	public async getCalendarByUUID(uuid: string): Promise<Calendar> {
		return (await this.getRepository()).findOne({ uuid });
	}

	public async saveCalendar(calendar: Calendar): Promise<Calendar> {
		return (await this.getRepository()).save(calendar);
	}

	private async getRepository(): Promise<Repository<Calendar>> {
		const conn = await this.connection.getConnection();
		return conn.getRepository(Calendar);
	}

	public async searchCalendar(from, to): Promise<Calendar[]> {
		// TODO : search against timeslot
		return (await this.getRepository()).find();
	}
}
