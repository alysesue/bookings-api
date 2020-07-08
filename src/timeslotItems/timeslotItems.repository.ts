import { InRequestScope } from "typescript-ioc";
import { RepositoryBase } from "../core/repository";
import { TimeslotItem, TimeslotsSchedule } from "../models";
import { FindConditions } from "typeorm";


@InRequestScope
export class TimeslotItemsRepository extends RepositoryBase<TimeslotsSchedule> {

	constructor() {
		super(TimeslotsSchedule);
	}

	public async getTimeslotsScheduleById(id: number): Promise<TimeslotsSchedule> {
		if (!id)
			return null;
		const repository = await this.getRepository();
		const entry = await repository.findOne(id, { relations: ['timeslotItems'] });
		return entry;
	}
}
