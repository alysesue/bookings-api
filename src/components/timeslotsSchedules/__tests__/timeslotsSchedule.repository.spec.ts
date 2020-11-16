import { Container } from 'typescript-ioc';
import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../../models';
import { TimeslotsScheduleRepository } from '../timeslotsSchedule.repository';
import { IEntityWithTimeslotsSchedule, ITimeslotsSchedule } from '../../../models/interfaces';
import { TransactionManager } from '../../../core/transactionManager';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../bookings/__tests__/bookings.mocks';
import { TimeslotItemsQueryAuthVisitor } from '../../timeslotItems/timeslotItems.auth';
import { UserConditionParams } from '../../../infrastructure/auth/authConditionCollection';
import { TimeslotItemsRepository } from '../../timeslotItems/timeslotItems.repository';

jest.mock('../../timeslotItems/timeslotItems.auth');

const QueryAuthVisitorMock = {
	createUserVisibilityCondition: jest.fn<Promise<UserConditionParams>, any>(),
};

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
	Container.bind(UserContext).to(UserContextMock);
	Container.bind(TimeslotItemsRepository).to(TimeslotItemsRepositoryMock);
});

beforeEach(() => {
	jest.resetAllMocks();

	(TimeslotItemsQueryAuthVisitor as jest.Mock).mockImplementation(() => QueryAuthVisitorMock);
	QueryAuthVisitorMock.createUserVisibilityCondition.mockImplementation(() =>
		Promise.resolve({ userCondition: '', userParams: {} }),
	);
});

describe('TimeslotsSchedule repository', () => {
	it('should get timeslotsSchedule', async () => {
		UserContextMock.getAuthGroups.mockReturnValue(Promise.resolve([]));
		const queryBuilderMock = {
			leftJoinAndSelect: jest.fn(() => queryBuilderMock),
			where: jest.fn(() => queryBuilderMock),
			getOne: jest.fn(() => Promise.resolve(timeslotsScheduleMock)),
		};
		TransactionManagerMock.createQueryBuilder.mockImplementation(() => queryBuilderMock);

		const repository = Container.get(TimeslotsScheduleRepository);
		const result = await repository.getTimeslotsScheduleById({ id: 1 });

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
		TransactionManagerMock.find.mockReturnValue(Promise.resolve([timeslotsScheduleMock]));
		const repository = Container.get(TimeslotsScheduleRepository);
		const entity1 = new SampleEntity();
		entity1.timeslotsScheduleId = 2;
		const entity2 = new SampleEntity();

		await repository.populateTimeslotsSchedules([entity1, entity2]);

		expect(TransactionManagerMock.find).toHaveBeenCalled();
		expect(entity1.timeslotsSchedule).toBeDefined();
		expect(entity2.timeslotsSchedule).not.toBeDefined();
	});

	it('should not call DB when array is empty', async () => {
		TransactionManagerMock.find.mockReturnValue(Promise.resolve(timeslotsScheduleMock));
		const repository = Container.get(TimeslotsScheduleRepository);
		await repository.getTimeslotsSchedules([]);
		expect(TransactionManagerMock.find).not.toHaveBeenCalled();
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

class TransactionManagerMock extends TransactionManager {
	public static createQueryBuilder = jest.fn();
	public static find = jest.fn();
	public static findOne = jest.fn();
	public static save = jest.fn();
	public static delete = jest.fn();

	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: () => ({
				createQueryBuilder: TransactionManagerMock.createQueryBuilder,
				find: TransactionManagerMock.find,
				findOne: TransactionManagerMock.findOne,
				save: TransactionManagerMock.save,
				delete: TransactionManagerMock.delete,
			}),
		};
		return Promise.resolve(entityManager);
	}
}

class TimeslotItemsRepositoryMock extends TimeslotItemsRepository {
	public static deleteTimeslotsForSchedule = jest.fn();

	public async deleteTimeslotsForSchedule(...params): Promise<any> {
		return await TimeslotItemsRepositoryMock.deleteTimeslotsForSchedule(...params);
	}
}
