import { Container } from 'typescript-ioc';
import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../../models';
import { TimeslotItemDBQuery, TimeslotsScheduleRepository } from '../timeslotsSchedule.repository';
import { IEntityWithTimeslotsSchedule, ITimeslotsSchedule } from '../../../models/interfaces';
import { TransactionManager } from '../../../core/transactionManager';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { TimeslotItemsQueryAuthVisitor } from '../../timeslotItems/timeslotItems.auth';
import { UserConditionParams } from '../../../infrastructure/auth/authConditionCollection';
import { TimeslotItemsRepository } from '../../timeslotItems/timeslotItems.repository';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { createQueryStream } from '../../../tools/pgQueryStreamContract';
import { ConnectionPool } from '../../../core/db.connectionPool';
import { PoolClient } from 'pg';
import * as events from 'events';

jest.mock('../../timeslotItems/timeslotItems.auth');
jest.mock('../../../tools/pgQueryStreamContract');

const QueryAuthVisitorMock = {
	createUserVisibilityCondition: jest.fn<Promise<UserConditionParams>, any>(),
};

const poolClientMock = {
	query: jest.fn(),
	release: jest.fn(),
} as Partial<PoolClient>;

class ConnectionPoolMock implements Partial<ConnectionPool> {
	public async getClient(): Promise<PoolClient> {
		return poolClientMock as PoolClient;
	}
}

function delay(n: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, n));
}

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(UserContext).to(UserContextMock);
	Container.bind(TimeslotItemsRepository).to(TimeslotItemsRepositoryMock);
	Container.bind(ConnectionPool).to(ConnectionPoolMock);
});

describe('TimeslotsSchedule repository', () => {
	const queryBuilderMock = {
		leftJoinAndSelect: jest.fn(),
		where: jest.fn(),
		getOne: jest.fn(),
		getMany: jest.fn(),
		getRawMany: jest.fn(),
		orderBy: jest.fn(),
		getQueryAndParameters: jest.fn(),
	};

	beforeEach(() => {
		jest.resetAllMocks();

		TransactionManagerMock.createQueryBuilder.mockReturnValue(queryBuilderMock);
		queryBuilderMock.where.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.leftJoinAndSelect.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.orderBy.mockImplementation(() => queryBuilderMock);
		queryBuilderMock.getOne.mockImplementation(() => Promise.resolve(null));
		queryBuilderMock.getMany.mockImplementation(() => Promise.resolve([]));
		queryBuilderMock.getRawMany.mockImplementation(() => Promise.resolve([]));

		(TimeslotItemsQueryAuthVisitor as jest.Mock).mockImplementation(() => QueryAuthVisitorMock);
		QueryAuthVisitorMock.createUserVisibilityCondition.mockImplementation(() =>
			Promise.resolve({ userCondition: '', userParams: {} }),
		);

		(createQueryStream as jest.Mock).mockReturnValue({});
	});

	it('should get timeslotsSchedule', async () => {
		UserContextMock.getAuthGroups.mockReturnValue(Promise.resolve([]));
		queryBuilderMock.getOne.mockImplementation(() => Promise.resolve(timeslotsScheduleMock));

		const repository = Container.get(TimeslotsScheduleRepository);
		const result = await repository.getTimeslotsScheduleById({ id: 1 });

		expect(queryBuilderMock.getOne).toBeCalled();
		expect(result).toStrictEqual(timeslotsScheduleMock);
	});

	it('should create timeslotsSchedule', async () => {
		TransactionManagerMock.save.mockReturnValue(Promise.resolve(timeslotsScheduleMock));
		const data = new TimeslotsSchedule();

		const repository = Container.get(TimeslotsScheduleRepository);
		const result = await repository.createTimeslotsSchedule(data);

		expect(TransactionManagerMock.save).toBeCalledTimes(1);
		expect(result).toBe(timeslotsScheduleMock);
	});

	it('should return null when id is falsy', async () => {
		const repository = Container.get(TimeslotsScheduleRepository);

		expect(await repository.getTimeslotsScheduleById({ id: 0 })).toBe(null);
		expect(await repository.getTimeslotsScheduleById({ id: null })).toBe(null);
		expect(await repository.getTimeslotsScheduleById({ id: undefined })).toBe(null);
	});

	it('should populate TimeslotsSchedules in entities (IEntityWithTimeslotsSchedule)', async () => {
		queryBuilderMock.getMany.mockReturnValue(Promise.resolve([timeslotsScheduleMock]));
		queryBuilderMock.getQueryAndParameters.mockReturnValue(['', {}]);

		(poolClientMock.query as jest.Mock).mockImplementation(() => {
			const emitter = new events.EventEmitter();

			setTimeout(async () => {
				const dbItem = {
					item__id: 2,
					item__startTime: '09:00:00',
					item__endTime: '10:00:00',
					item__weekDay: 1,
					item__timeslotsScheduleId: 1,
					item__capacity: 3,
				} as TimeslotItemDBQuery;

				emitter.emit('data', dbItem);
				await delay(3);
				emitter.emit('data', { ...dbItem, item__timeslotsScheduleId: 2 });
				await delay(3);
				emitter.emit('end');
			}, 10);
			return Promise.resolve(emitter);
		});

		const repository = Container.get(TimeslotsScheduleRepository);
		const entity1 = new SampleEntity();
		entity1.timeslotsScheduleId = 2;
		const entity2 = new SampleEntity();

		await repository.populateTimeslotsSchedules([entity1, entity2], {});

		expect(queryBuilderMock.getMany).toHaveBeenCalled();
		expect(queryBuilderMock.getQueryAndParameters).toHaveBeenCalled();
		expect(poolClientMock.query).toBeCalled();
		expect(poolClientMock.release).toBeCalled();

		expect(entity1.timeslotsSchedule).toBeDefined();
		expect(entity2.timeslotsSchedule).not.toBeDefined();
	});

	it('(2) should populate TimeslotsSchedules in entities (IEntityWithTimeslotsSchedule) with options', async () => {
		queryBuilderMock.getMany.mockReturnValue(Promise.resolve([timeslotsScheduleMock]));
		queryBuilderMock.getQueryAndParameters.mockReturnValue(['', {}]);

		(poolClientMock.query as jest.Mock).mockImplementation(() => {
			const emitter = new events.EventEmitter();

			setTimeout(async () => {
				const dbItem = {
					item__id: 2,
					item__startTime: '09:00:00',
					item__endTime: '10:00:00',
					item__weekDay: 1,
					item__timeslotsScheduleId: 1,
					item__capacity: 3,
				} as TimeslotItemDBQuery;

				emitter.emit('data', dbItem);
				await delay(3);
				emitter.emit('data', { ...dbItem, item__timeslotsScheduleId: 2 });
				await delay(3);
				emitter.emit('end');
			}, 10);
			return Promise.resolve(emitter);
		});

		const repository = Container.get(TimeslotsScheduleRepository);
		const entity1 = new SampleEntity();
		entity1.timeslotsScheduleId = 2;
		const entity2 = new SampleEntity();

		await repository.populateTimeslotsSchedules([entity1, entity2], {
			weekDays: [2],
			startTime: TimeOfDay.create({ hours: 8, minutes: 0 }),
			endTime: TimeOfDay.create({ hours: 9, minutes: 0 }),
		});

		expect(TransactionManagerMock.createQueryBuilder).toHaveBeenCalledTimes(2);
		expect(queryBuilderMock.getMany).toHaveBeenCalled();
		expect(queryBuilderMock.getQueryAndParameters).toHaveBeenCalled();
		expect(poolClientMock.query).toBeCalled();
		expect(poolClientMock.release).toBeCalled();

		expect(entity1.timeslotsSchedule).toBeDefined();
		expect(entity2.timeslotsSchedule).not.toBeDefined();
	});

	it('should not call DB when array is empty', async () => {
		queryBuilderMock.getMany.mockReturnValue(Promise.resolve(timeslotsScheduleMock));
		const repository = Container.get(TimeslotsScheduleRepository);
		await repository.getTimeslotsSchedulesNoAuth({ scheduleIds: [] });
		expect(queryBuilderMock.getMany).not.toHaveBeenCalled();
	});

	it('should should delete timeslot schedule', async () => {
		TransactionManagerMock.delete.mockImplementation(() => Promise.resolve());

		const repository = Container.get(TimeslotsScheduleRepository);
		await repository.deleteTimeslotsSchedule(1);

		expect(TimeslotItemsRepositoryMock.deleteTimeslotsForSchedule).toBeCalled();
		expect(TransactionManagerMock.delete).toBeCalled();
	});
});

class SampleEntity implements IEntityWithTimeslotsSchedule {
	public timeslotsScheduleId: number;
	public timeslotsSchedule: ITimeslotsSchedule;
}

const timeslotsScheduleMock = new TimeslotsSchedule();
timeslotsScheduleMock._id = 2;
timeslotsScheduleMock.timeslotItems = [
	TimeslotItem.create(
		1,
		1,
		TimeOfDay.create({ hours: 11, minutes: 0 }),
		TimeOfDay.create({ hours: 11, minutes: 30 }),
	),
];

class TransactionManagerMock implements Partial<TransactionManager> {
	public static createQueryBuilder = jest.fn();
	public static save = jest.fn();
	public static delete = jest.fn();

	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				createQueryBuilder: TransactionManagerMock.createQueryBuilder,
				save: TransactionManagerMock.save,
				delete: TransactionManagerMock.delete,
			}),
		};
		return Promise.resolve(entityManager);
	}
}

class TimeslotItemsRepositoryMock implements Partial<TimeslotItemsRepository> {
	public static deleteTimeslotsForSchedule = jest.fn();

	public async deleteTimeslotsForSchedule(...params): Promise<any> {
		return await TimeslotItemsRepositoryMock.deleteTimeslotsForSchedule(...params);
	}
}
