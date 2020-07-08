import { InRequestScope } from "typescript-ioc";
import { RepositoryBase } from "../core/repository";
import { TimeslotItem, TimeslotsSchedule } from "../models";
import { FindConditions } from "typeorm";


@InRequestScope
export class TimeslotItemsRepository extends RepositoryBase<TimeslotsSchedule> {

	constructor() {
		super(TimeslotsSchedule);
	}

	public async getTimeslotsScheduleById(options: { serviceId?: number } = {}): Promise<TimeslotsSchedule> {
		const findConditions: FindConditions<TimeslotsSchedule> = {};
		console.log(options.serviceId);
		if (options.serviceId) {
			findConditions['_serviceId'] = options.serviceId;
		}
		const repository = await this.getRepository();
		const entries = await repository.findOne({ where: [findConditions], relations: ['timeslotItems'] });
		return entries;

	}

}
