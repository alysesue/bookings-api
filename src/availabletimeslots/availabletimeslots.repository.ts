import { Inject, Singleton } from 'typescript-ioc';

import { DbConnection } from '../core/db.connection';
import { AvailableTimeslot } from '../models/AvailableTimeslot';
import { Repository } from "typeorm";

@Singleton
export class AvailableTimeslotsRepository {
	@Inject
	private connection: DbConnection;

	private async getRepository(): Promise<Repository<AvailableTimeslot>> {
		const conn = await this.connection.getConnection();
		return conn.getRepository(AvailableTimeslot);
	}

	public async getCalendars(): Promise<AvailableTimeslot[]> {
		return (await this.getRepository()).find();
	}

	public async saveCalendar(timeslot: AvailableTimeslot): Promise<AvailableTimeslot> {
		return (await this.getRepository()).save(timeslot);
	}
}
