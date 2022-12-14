import { Scope, Scoped } from 'typescript-ioc';
import { DeleteResult, In } from 'typeorm';
import { WeekDayBreak } from '../../models';
import { RepositoryBase } from '../../core/repository';

@Scoped(Scope.Request)
export class WeekDayBreakRepository extends RepositoryBase<WeekDayBreak> {
	constructor() {
		super(WeekDayBreak);
	}

	public async getBreaksForSchedules(scheduleFormIds: number[]): Promise<WeekDayBreak[]> {
		if (scheduleFormIds.length)
			return (await this.getRepository()).find({
				where: { scheduleFormId: In(scheduleFormIds) },
			});
		return [];
	}

	public async deleteBreaksForSchedule(scheduleFormId: number): Promise<DeleteResult> {
		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder()
			.delete()
			.from(WeekDayBreak)
			.where('scheduleFormId = :scheduleFormId', { scheduleFormId });

		return query.execute();
	}

	public async save(entities: WeekDayBreak[]): Promise<WeekDayBreak[]> {
		return (await this.getRepository()).save(entities);
	}
}
