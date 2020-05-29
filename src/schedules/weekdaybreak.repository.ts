import { Inject, Singleton } from 'typescript-ioc';
import { DbConnection } from '../core/db.connection';
import { Schedule, WeekDayBreak } from '../models';
import { DeleteResult, In, Repository } from "typeorm";
import { groupByKey } from '../tools/collections';

@Singleton
export class WeekDayBreakRepository {
	@Inject
	private connection: DbConnection;

	public async getBreaksForSchedules(scheduleIds: number[]): Promise<WeekDayBreak[]> {
		return (await this.getRepository()).find({
			where: {
				scheduleId: In(scheduleIds)
			}
		});
	}

	public async deleteBreaksForSchedule(scheduleId: number): Promise<DeleteResult> {
		const query = (await this.connection.getConnection())
			.createQueryBuilder()
			.delete()
			.from(WeekDayBreak)
			.where("scheduleId = :scheduleId", { scheduleId });

		return query.execute();
	}

	public async save(entities: WeekDayBreak[]): Promise<WeekDayBreak[]> {
		return (await this.getRepository()).save(entities);
	}

	private async getRepository(): Promise<Repository<WeekDayBreak>> {
		const conn = await this.connection.getConnection();
		return conn.getRepository(WeekDayBreak);
	}
}
