import { Inject, InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { TimeslotsSchedule } from '../../models';
import { DeleteResult, FindManyOptions, In } from 'typeorm';
import { IEntityWithTimeslotsSchedule } from '../../models/interfaces';
import { groupByKeyLastValue } from '../../tools/collections';
import { UserContext } from '../../infrastructure/auth/userContext';
import { TimeslotItemsQueryAuthVisitor } from '../timeslotItems/timeslotItems.auth';
import { TimeslotItemsRepository, TimeslotItemsSearchRequest } from '../timeslotItems/timeslotItems.repository';

@InRequestScope
export class TimeslotsScheduleRepository extends RepositoryBase<TimeslotsSchedule> {
	@Inject
	private timeslotItemsRepository: TimeslotItemsRepository;
	@Inject
	private _userContext: UserContext;

	constructor() {
		super(TimeslotsSchedule);
	}

	public async createTimeslotsSchedule(data: TimeslotsSchedule): Promise<TimeslotsSchedule> {
		const repository = await this.getRepository();
		return await repository.save(data);
	}

	public async getTimeslotsScheduleById(request: TimeslotItemsSearchRequest): Promise<TimeslotsSchedule> {
		if (!request.id) return null;
		const repository = await this.getRepository();
		const authGroups = await this._userContext.getAuthGroups();

		const { userCondition, userParams } = request.byPassAuth
			? { userCondition: '', userParams: {} }
			: await new TimeslotItemsQueryAuthVisitor(
					'service',
					'serviceProvider',
					'SPservice',
			  ).createUserVisibilityCondition(authGroups);

		const query = repository
			.createQueryBuilder('timeslotsSchedule')
			.where(
				['timeslotsSchedule._id = :id', userCondition]
					.filter((c) => c)
					.map((c) => `(${c})`)
					.join(' AND '),
				{ ...userParams, id: request.id },
			)
			.leftJoinAndSelect('timeslotsSchedule.timeslotItems', 'timeslotItems')
			.leftJoinAndSelect('timeslotsSchedule._service', 'service')
			.leftJoinAndSelect('timeslotsSchedule._serviceProvider', 'serviceProvider')
			.leftJoinAndSelect('serviceProvider._service', 'SPservice');

		return await query.getOne();
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

	public async deleteTimeslotsSchedule(scheduleId: number): Promise<DeleteResult> {
		await this.timeslotItemsRepository.deleteTimeslotsForSchedule(scheduleId);
		return (await this.getRepository()).delete(scheduleId);
	}
}
