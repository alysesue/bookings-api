import { Scope, Scoped } from 'typescript-ioc';
import { WeekDayBreak } from '../models';
import { DeleteResult, In } from "typeorm";
import { RepositoryBase } from '../core/repository';

@Scoped(Scope.Request)
export class WeekDayBreakRepository extends RepositoryBase<WeekDayBreak> {

	constructor() {
		super(WeekDayBreak);
	}

	public async getBreaksForSchedules(scheduleIds: number[]): Promise<WeekDayBreak[]> {
		return (await this.getRepository()).find({
			where: {
				scheduleId: In(scheduleIds)
			}
		});
	}

	public async deleteBreaksForSchedule(scheduleId: number): Promise<DeleteResult> {
		const connection = (await this.getConnection());
		const query = connection
			.createQueryBuilder()
			.delete()
			.from(WeekDayBreak)
			.where("scheduleId = :scheduleId", { scheduleId });

		return query.execute();
	}

	public async save(entities: WeekDayBreak[]): Promise<WeekDayBreak[]> {
		return (await this.getRepository()).save(entities);
	}
}
