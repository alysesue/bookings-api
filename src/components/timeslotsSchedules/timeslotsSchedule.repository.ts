import { InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { TimeslotsSchedule } from '../../models';
import { FindManyOptions, In } from 'typeorm';
import { IEntityWithTimeslotsSchedule } from '../../models/interfaces';
import { groupByKeyLastValue } from '../../tools/collections';

@InRequestScope
export class TimeslotsScheduleRepository extends RepositoryBase<TimeslotsSchedule> {
	constructor() {
		super(TimeslotsSchedule);
	}

	public async createTimeslotsSchedule(data: TimeslotsSchedule): Promise<TimeslotsSchedule> {
		const repository = await this.getRepository();
		return await repository.save(data);
	}

	public async getTimeslotsScheduleById(id: number, options: { retrieveService?: boolean, retrieveServiceProvider?: boolean } = {}): Promise<TimeslotsSchedule> {
		if (!id) return null;
		const repository = await this.getRepository();
		const entry = await repository.findOne(id, { relations: this.getRelations(options) });
		return entry;
	}

	private getRelations(options: { retrieveService?: boolean, retrieveServiceProvider?: boolean }): string[] {
		const relations = ['timeslotItems'];
		if (options.retrieveService) relations.push('_service');
		if (options.retrieveServiceProvider) relations.push('_serviceProvider');
		return relations;
	}

	public async getTimeslotsSchedules(ids: number[]): Promise<TimeslotsSchedule[]> {
		if (ids.length === 0) return [];

		const options: FindManyOptions<TimeslotsSchedule> = { relations: ['timeslotItems'] };
		options.where = { _id: In(ids) };

		return await (await this.getRepository()).find(options);
	}

	public async populateTimeslotsSchedules<T extends IEntityWithTimeslotsSchedule>(entries: T[]): Promise<T[]> {
		const relatedIdList = entries.map((e) => e.timeslotsScheduleId).filter((id) => !!id);

		const schedulesById = groupByKeyLastValue(await this.getTimeslotsSchedules(relatedIdList), (s) => s._id);

		for (const entry of entries.filter((c) => !!c.timeslotsScheduleId)) {
			entry.timeslotsSchedule = schedulesById.get(entry.timeslotsScheduleId);
		}
		return entries;
	}
}
