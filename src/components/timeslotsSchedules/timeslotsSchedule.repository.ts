import { Inject, InRequestScope } from 'typescript-ioc';
import { DeleteResult, Repository } from 'typeorm';
import { RepositoryBase } from '../../core/repository';
import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../models';
import { IEntityWithTimeslotsSchedule } from '../../models/interfaces';
import { groupByKeyLastValue } from '../../tools/collections';
import { UserContext } from '../../infrastructure/auth/userContext';
import { TimeslotItemsQueryAuthVisitor } from '../timeslotItems/timeslotItems.auth';
import { TimeslotItemsRepository, TimeslotItemsSearchRequest } from '../timeslotItems/timeslotItems.repository';
import { StopWatch } from '../../infrastructure/stopWatch';
import { andWhere } from '../../tools/queryConditions';
import { Weekday } from '../../enums/weekday';
import { EmptyGroupRecordIterator, GroupRecordIterator, IGroupRecordIterator } from './groupRecordIterator';
import { QueryStreamConfig, createQueryStream } from '../../tools/pgQueryStreamContract';
import { ConnectionPool } from '../../core/db.connectionPool';
import { PoolClient } from 'pg';

export type TimeslotItemDBQuery = {
	item__id: number;
	item__startTime: string;
	item__endTime: string;
	item__weekDay: number;
	item__timeslotsScheduleId: number;
	item__capacity: number;
	item__startDate: Date;
	item__endDate: Date;
};

const STREAM_BATCH_SIZE = 500;

@InRequestScope
export class TimeslotsScheduleRepository extends RepositoryBase<TimeslotsSchedule> {
	@Inject
	private timeslotItemsRepository: TimeslotItemsRepository;
	@Inject
	private _userContext: UserContext;
	@Inject
	private connectionPool: ConnectionPool;

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
		entity._startDate = entry.item__startDate;
		entity._endDate = entry.item__endDate;
		return entity;
	}

	private createCommonFilterCondition(commonOptions: {
		weekDays?: Weekday[];
		startTime?: TimeOfDay;
		endTime?: TimeOfDay;
	}): [string[], {}] {
		const { weekDays, startTime, endTime } = commonOptions;

		const weekDayCondition = weekDays && weekDays.length > 0 ? 'item."_weekDay" IN (:...weekDays)' : '';
		const startTimeCondition = startTime ? 'item."_endTime" > :startTime' : '';
		const endTimeCondition = endTime ? 'item."_startTime" < :endTime' : '';

		return [
			[weekDayCondition, startTimeCondition, endTimeCondition],
			{
				weekDays,
				startTime: startTime?.toString(),
				endTime: endTime?.toString(),
			},
		];
	}

	/* No auth in this method */
	public async getTimeslotsForServiceProviders(options: {
		serviceId: number;
		providerIds?: number[];
		weekDays?: Weekday[];
		startTime?: TimeOfDay;
		endTime?: TimeOfDay;
	}): Promise<IGroupRecordIterator<TimeslotItem>> {
		const { serviceId, providerIds, ...commonOptions } = options;

		const serviceCondition = 'sp."_serviceId" = :serviceId';
		const providersCondition =
			providerIds && providerIds.length > 0 ? 'sp._id IN (:...providerIds)' : 'sp._id IS NOT NULL';
		const [commonFilter, commonParams] = this.createCommonFilterCondition(commonOptions);

		const query = await (await this.getEntityManager())
			.getRepository<Repository<TimeslotItem>>(TimeslotItem)
			.createQueryBuilder('item')
			.where(andWhere([serviceCondition, providersCondition, ...commonFilter]), {
				serviceId,
				providerIds,
				...commonParams,
			})
			.leftJoin('service_provider', 'sp', 'sp."_timeslotsScheduleId" = item."_timeslotsScheduleId"')
			.addSelect('sp._id', 'spId')
			.orderBy('sp._id');

		const [sql, parameters] = query.getQueryAndParameters();
		let client: PoolClient;

		const iterator = new GroupRecordIterator(
			async () => {
				const queryStream = createQueryStream(sql, parameters, {
					highWaterMark: STREAM_BATCH_SIZE * 2,
					batchSize: STREAM_BATCH_SIZE,
				} as QueryStreamConfig);

				client = await this.connectionPool.getClient();
				return client.query(queryStream);
			},
			async () => client?.release(),
			'spId',
			TimeslotsScheduleRepository.mapFromDB,
		);

		return iterator;
	}

	private async loadTimeslotsForSchedules(options: {
		scheduleIds: number[];
		weekDays?: Weekday[];
		startTime?: TimeOfDay;
		endTime?: TimeOfDay;
	}): Promise<IGroupRecordIterator<TimeslotItem>> {
		const { scheduleIds, ...commonOptions } = options;
		if (scheduleIds.length === 0) return new EmptyGroupRecordIterator<TimeslotItem>();

		const scheduleIdCondition = 'item._timeslotsScheduleId IN (:...scheduleIds)';
		const [commonFilter, commonParams] = this.createCommonFilterCondition(commonOptions);

		const query = await (await this.getEntityManager())
			.getRepository<Repository<TimeslotItem>>(TimeslotItem)
			.createQueryBuilder('item')
			.where(andWhere([scheduleIdCondition, ...commonFilter]), {
				scheduleIds,
				...commonParams,
			})
			.orderBy('item._timeslotsScheduleId');

		const [sql, parameters] = query.getQueryAndParameters();
		let client: PoolClient;

		const iterator = new GroupRecordIterator(
			async () => {
				const queryStream = createQueryStream(sql, parameters, {
					highWaterMark: STREAM_BATCH_SIZE * 2,
					batchSize: STREAM_BATCH_SIZE,
				});

				client = await this.connectionPool.getClient();
				return client.query(queryStream);
			},
			async () => client?.release(),
			'item__timeslotsScheduleId',
			TimeslotsScheduleRepository.mapFromDB,
		);

		return iterator;
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
		const scheduleLookup = groupByKeyLastValue(schedules, (s) => s._id);
		schedules.forEach((s) => (s.timeslotItems = []));

		const timeslotIterator = await this.loadTimeslotsForSchedules(options);
		for await (const [scheduleId, timeslotItems] of timeslotIterator.getRecords()) {
			const schedule = scheduleLookup.get(scheduleId);
			if (schedule) {
				schedule.timeslotItems = timeslotItems;
			}
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

		const loadTimeslots = new StopWatch('Load timeslots for schedule');
		try {
			const schedulesById = groupByKeyLastValue(
				await this.getTimeslotsSchedulesNoAuth({ ...timeslotsScheduleOptions, scheduleIds }),
				(s) => s._id,
			);

			for (const entry of entries.filter((c) => !!c.timeslotsScheduleId)) {
				entry.timeslotsSchedule = schedulesById.get(entry.timeslotsScheduleId);
			}
			return entries;
		} finally {
			loadTimeslots.stop();
		}
	}

	public async deleteTimeslotsSchedule(scheduleId: number): Promise<DeleteResult> {
		await this.timeslotItemsRepository.deleteTimeslotsForSchedule(scheduleId);
		return (await this.getRepository()).delete(scheduleId);
	}
}
