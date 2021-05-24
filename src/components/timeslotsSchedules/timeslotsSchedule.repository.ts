import { Inject, InRequestScope } from 'typescript-ioc';
import { DeleteResult } from 'typeorm';
import { RepositoryBase } from '../../core/repository';
import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../models';
import { IEntityWithTimeslotsSchedule } from '../../models/interfaces';
import { groupByKey, groupByKeyLastValue } from '../../tools/collections';
import { UserContext } from '../../infrastructure/auth/userContext';
import { TimeslotItemsQueryAuthVisitor } from '../timeslotItems/timeslotItems.auth';
import { TimeslotItemsRepository, TimeslotItemsSearchRequest } from '../timeslotItems/timeslotItems.repository';
import { StopWatch } from '../../infrastructure/stopWatch';
import { nextImmediateTick } from '../../infrastructure/immediateHelper';
import { andWhere } from '../../tools/queryConditions';
import { Weekday } from '../../enums/weekday';

type TimeslotItemDBQuery = {
	item__id: number;
	item__startTime: string;
	item__endTime: string;
	item__weekDay: number;
	item__timeslotsScheduleId: number;
	item__capacity: number;
};

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
			.where(andWhere([userCondition, 'timeslotsSchedule._id = :id']), { ...userParams, id: request.id })
			.leftJoinAndSelect('timeslotsSchedule.timeslotItems', 'timeslotItems')
			.leftJoinAndSelect('timeslotsSchedule._service', 'service')
			.leftJoinAndSelect('timeslotsSchedule._serviceProvider', 'serviceProvider')
			.leftJoinAndSelect('serviceProvider._service', 'SPservice');

		return await query.getOne();
	}

	private static mapFromDB(entry: TimeslotItemDBQuery): TimeslotItem {
		const entity = new TimeslotItem();
		entity._id = entry.item__id;
		entity._startTime = TimeOfDay.parse(entry.item__startTime);
		entity._endTime = TimeOfDay.parse(entry.item__endTime);
		entity._weekDay = entry.item__weekDay;
		entity._timeslotsScheduleId = entry.item__timeslotsScheduleId;
		entity._capacity = entry.item__capacity;
		return entity;
	}

	private async loadTimeslotsForSchedules(options: {
		scheduleIds: number[];
		weekDays?: Weekday[];
		startTime?: TimeOfDay;
		endTime?: TimeOfDay;
	}): Promise<TimeslotItem[]> {
		const { scheduleIds, weekDays, startTime, endTime } = options;
		if (scheduleIds.length === 0) return [];

		const loadTimeslots = new StopWatch('Load timeslots');
		try {
			const scheduleIdCondition = 'item._timeslotsScheduleId IN (:...scheduleIds)';
			const weekDayCondition = weekDays && weekDays.length > 0 ? 'item."_weekDay" IN (:...weekDays)' : '';
			const startTimeCondition = startTime ? 'item."_endTime" > :startTime' : '';
			const endTimeCondition = endTime ? 'item."_startTime" < :endTime' : '';

			const entries = await (await this.getEntityManager())
				.getRepository(TimeslotItem)
				.createQueryBuilder('item')
				.where(andWhere([scheduleIdCondition, weekDayCondition, startTimeCondition, endTimeCondition]), {
					scheduleIds,
					weekDays,
					startTime: startTime?.toString(),
					endTime: endTime?.toString(),
				})
				.getRawMany<TimeslotItemDBQuery>();

			await nextImmediateTick();
			const timeslots = entries.map(TimeslotsScheduleRepository.mapFromDB);
			await nextImmediateTick();
			return timeslots;
		} finally {
			loadTimeslots.stop();
		}
	}

	public async getTimeslotsSchedulesNoAuth(options: {
		scheduleIds: number[];
		weekDays?: Weekday[];
		startTime?: TimeOfDay;
		endTime?: TimeOfDay;
	}): Promise<TimeslotsSchedule[]> {
		const { scheduleIds } = options;
		if (scheduleIds.length === 0) return [];

		const repository = await this.getRepository();
		const schedules = await repository
			.createQueryBuilder('timeslotsSchedule')
			.where('timeslotsSchedule._id IN (:...scheduleIds)', { scheduleIds })
			.getMany();

		const timeslots = await this.loadTimeslotsForSchedules(options);

		const timeslotsLookup = groupByKey(timeslots, (i) => i._timeslotsScheduleId);
		for (const schedule of schedules) {
			schedule.timeslotItems = timeslotsLookup.get(schedule._id) || [];
		}

		return schedules;
	}

	public async populateTimeslotsSchedules<T extends IEntityWithTimeslotsSchedule>(
		entries: T[],
		timeslotsScheduleOptions: {
			weekDays?: Weekday[];
			startTime?: TimeOfDay;
			endTime?: TimeOfDay;
		},
	): Promise<T[]> {
		const scheduleIds = entries.map((e) => e.timeslotsScheduleId).filter((id) => !!id);

		const schedulesById = groupByKeyLastValue(
			await this.getTimeslotsSchedulesNoAuth({ ...timeslotsScheduleOptions, scheduleIds }),
			(s) => s._id,
		);

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
