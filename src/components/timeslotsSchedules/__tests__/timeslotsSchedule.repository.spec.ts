import { Container } from 'typescript-ioc';
import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../../models';
import { TimeslotsScheduleRepository } from '../timeslotsSchedule.repository';
import { IEntityWithTimeslotsSchedule, ITimeslotsSchedule } from '../../../models/interfaces';
import { TransactionManager } from '../../../core/transactionManager';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(TransactionManager).to(TransactionManagerMock);
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe('TimeslotsSchedule repository', () => {
	it('should get timeslotsSchedule', async () => {
		const repository = Container.get(TimeslotsScheduleRepository);
		const result = await repository.getTimeslotsScheduleById(1);
		expect(result).not.toBe(undefined);
		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.findOne).toBeCalledTimes(1);
	});

	it('should create timeslotsSchedule', async () => {
		const repository = Container.get(TimeslotsScheduleRepository);
		const data = new TimeslotsSchedule();
		const result = await repository.createTimeslotsSchedule(data);
		expect(result).not.toBe(undefined);
		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.save).toBeCalledTimes(1);
	});

	it('should return null when id is falsy', async () => {
		const repository = Container.get(TimeslotsScheduleRepository);
		expect(await repository.getTimeslotsScheduleById(null)).toBe(null);
		expect(await repository.getTimeslotsScheduleById(undefined)).toBe(null);
		expect(await repository.getTimeslotsScheduleById(0)).toBe(null);
	});

	it('should populate TimeslotsSchedules in entities (IEntityWithTimeslotsSchedule)', async () => {
		const repository = Container.get(TimeslotsScheduleRepository);
		const entity1 = new SampleEntity();
		entity1.timeslotsScheduleId = 2;
		const entity2 = new SampleEntity();

		await repository.populateTimeslotsSchedules([entity1, entity2]);
		expect(InnerRepositoryMock.find).toHaveBeenCalled();
		expect(entity1.timeslotsSchedule).toBeDefined();
		expect(entity2.timeslotsSchedule).not.toBeDefined();
	});

	it('should not call DB when array is empty', async () => {
		const repository = Container.get(TimeslotsScheduleRepository);
		await repository.getTimeslotsSchedules([]);
		expect(InnerRepositoryMock.find).not.toHaveBeenCalled();
	});

});


class SampleEntity implements IEntityWithTimeslotsSchedule {
	public timeslotsScheduleId: number;
	public timeslotsSchedule: ITimeslotsSchedule;
}

const timeslotsScheduleMock = new TimeslotsSchedule();
timeslotsScheduleMock._id = 2;
timeslotsScheduleMock.timeslotItems = [TimeslotItem.create(1, 1, TimeOfDay.create({ hours: 11, minutes: 0 }), TimeOfDay.create({ hours: 11, minutes: 30 }))];

const InnerRepositoryMock = {
	find: jest.fn().mockImplementation(() => {
		return Promise.resolve([timeslotsScheduleMock]);
	}),
	findOne: jest.fn().mockImplementation(() => {
		return Promise.resolve(timeslotsScheduleMock);
	}),
	save: jest.fn().mockImplementation(() => {
		return Promise.resolve(timeslotsScheduleMock);
	}),
};


const GetRepositoryMock = jest.fn().mockImplementation(() => InnerRepositoryMock);


class TransactionManagerMock extends TransactionManager {
	public async getEntityManager(): Promise<any> {
		const entityManager = {
			getRepository: GetRepositoryMock,
		};
		return Promise.resolve(entityManager);
	}
}
