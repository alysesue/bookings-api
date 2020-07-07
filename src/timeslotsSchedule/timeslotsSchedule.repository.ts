import { InRequestScope } from "typescript-ioc";
import { RepositoryBase } from "../core/repository";
import { TimeslotsSchedule } from "../models";


@InRequestScope
export class TimeslotsScheduleRepository extends RepositoryBase<TimeslotsSchedule> {

	constructor() {
		super(TimeslotsSchedule);
	}

	public async getTimeslotsScheduleById(id: number): Promise<TimeslotsSchedule> {
		const schedule = await (await this.getRepository()).findOne(id, {
			relations: ['timeslot']
		});
		return schedule;
	}

}
