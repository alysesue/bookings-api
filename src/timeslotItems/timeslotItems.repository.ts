import { InRequestScope } from "typescript-ioc";
import { RepositoryBase } from "../core/repository";
import { TimeslotsSchedule, TimeslotItem } from "../models";
import { FindConditions } from "typeorm";


@InRequestScope
export class TimeslotItemsRepository extends RepositoryBase<TimeslotItem> {

	constructor() {
		super(TimeslotItem);
	}

	public async getTimeslotsScheduleById(options: { timeslotsScheduleId?: number } = {}): Promise<TimeslotItem[]> {
		const findConditions: FindConditions<TimeslotItem> = {};
		if (options.timeslotsScheduleId) {
			findConditions['timeslotScheduleId'] = options.timeslotsScheduleId;
		}
		const repository = await this.getRepository();
		const entries = await repository.find({ where: [findConditions], relations: ['_timeslotsSchedule'] });
		return entries;

	}

}
