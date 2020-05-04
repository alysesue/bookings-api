import { Inject, Singleton } from 'typescript-ioc';

import { DbConnection } from '../../core/db.connection';
import { Timeslot } from '../../models/timeslot';
import { DeleteResult, Repository } from "typeorm";

@Singleton
export class TimeslotsRepository {
	@Inject
	private connection: DbConnection;

	private async getRepository(): Promise<Repository<Timeslot>> {
		const conn = await this.connection.getConnection();
		return conn.getRepository(Timeslot);
	}

	public async getTimeslots(isAvailable: boolean): Promise<Timeslot[]> {
		return (await this.getRepository()).find({
			where: { isAvailable }
		});
	}

	public async addTimeslot(timeslot: Timeslot): Promise<Timeslot> {
		return (await this.getRepository()).save(timeslot);
	}

	public async deleteTimeslot(timeslotId: number): Promise<DeleteResult> {
		return (await this.getRepository()).delete(timeslotId);
	}
}
