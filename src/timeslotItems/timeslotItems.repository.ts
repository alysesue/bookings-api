import { InRequestScope } from "typescript-ioc";
import { RepositoryBase } from "../core/repository";
import { TimeslotsSchedule } from "../models";
import { FindManyOptions, In } from "typeorm";
import { IEntityWithTimeslotsSchedule } from "../models/interfaces";
import { groupByKeyLastValue } from "../tools/collections";

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

	public async getTimeslotsSchedules(ids: number[]): Promise<TimeslotsSchedule[]> {
		const options: FindManyOptions<TimeslotsSchedule> = { relations: ['timeslotItems'] };
		options.where = { _id: In(ids) };

		return await (await this.getRepository()).find(options);
	}

	public async populateTimeslotsSchedules<T extends IEntityWithTimeslotsSchedule>(entries: T[]): Promise<T[]> {
		const relatedIdList = entries.map(e => e.timeslotsScheduleId).filter(id => !!id);

		const schedulesById = groupByKeyLastValue(await this.getTimeslotsSchedules(relatedIdList), s => s._id);

		for (const entry of entries.filter(c => !!c.timeslotsScheduleId)) {
			entry.timeslotsSchedule = schedulesById.get(entry.timeslotsScheduleId);
		}
		return entries;
	}
}
