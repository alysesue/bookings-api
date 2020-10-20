import { Inject, InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { TimeslotsSchedule } from '../../models';
import { FindManyOptions, In } from 'typeorm';
import { IEntityWithTimeslotsSchedule } from '../../models/interfaces';
import { groupByKeyLastValue } from '../../tools/collections';
import { UserContext } from '../../infrastructure/auth/userContext';
import { TimeslotItemsAuthQueryVisitor } from '../timeslotItems/timeslotItems.auth';

@InRequestScope
export class TimeslotsScheduleRepository extends RepositoryBase<TimeslotsSchedule> {
	@Inject
	private _userContext: UserContext;

	constructor() {
		super(TimeslotsSchedule);
	}

	public async createTimeslotsSchedule(data: TimeslotsSchedule): Promise<TimeslotsSchedule> {
		const repository = await this.getRepository();
		return await repository.save(data);
	}

	public async getTimeslotsScheduleById(id: number): Promise<TimeslotsSchedule> {
		if (!id) return null;
		const repository = await this.getRepository();

		const { userCondition, userParams } = await new TimeslotItemsAuthQueryVisitor(
			's',
			'sp',
		).createUserVisibilityCondition(await this._userContext.getAuthGroups());

		const queryBuilder = repository
			.createQueryBuilder('ts')
			.leftJoinAndMapMany('ts.timeslotItems', 'timeslot_item', 'items', 'items._timeslotsScheduleId = ts._id')
			.leftJoinAndMapOne('ts._service', 'service', 's', 's._timeslotsScheduleId = ts._id')
			.leftJoinAndMapOne('ts._serviceProvider', 'service_provider', 'sp', 'sp._timeslotsScheduleId = ts._id');

		return await queryBuilder
			.where(
				['ts._id = :id', userCondition]
					.filter((c) => c)
					.map((c) => `(${c})`)
					.join(' AND '),
				{ id, ...userParams },
			)
			.getOne();
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
