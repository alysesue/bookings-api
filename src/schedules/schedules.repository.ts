import { Inject, Singleton } from 'typescript-ioc';

import { DbConnection } from '../core/db.connection';
import { Schedule } from '../models/Schedule';
import { DeleteResult, Repository } from "typeorm";

@Singleton
export class SchedulesRepository {
	@Inject
	private connection: DbConnection;

	public async getScheduleById(id: number): Promise<Schedule> {
		return (await this.getRepository()).findOne({ id });
	}

	public async getScheduleByName(name: string): Promise<Schedule> {
		return (await this.getRepository()).findOne({ name });
	}

	public async setSchedule(timeslot: Schedule): Promise<Schedule> {
		return (await this.getRepository()).save(timeslot);
	}

	public async deleteSchedule(timeslotId: number): Promise<DeleteResult> {
		return (await this.getRepository()).delete(timeslotId);
	}

	private async getRepository(): Promise<Repository<Schedule>> {
		const conn = await this.connection.getConnection();
		return conn.getRepository(Schedule);
	}
}
