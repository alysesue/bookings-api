import { DbConnection } from '../../core/db.connection';
import { Container } from 'typescript-ioc';
import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../models';
import { TimeslotItemsRepository } from '../timeslotItems.repository';
import { IEntityWithTimeslotsSchedule, ITimeslotsSchedule } from '../../models/interfaces';

beforeEach(() => {
	Container.bind(DbConnection).to(DbConnectionMock);
	jest.clearAllMocks();
});

describe('TimeslotsSchedule repository', () => {
	it('should get timeslotsSchedule', async () => {
		const repository = Container.get(TimeslotItemsRepository);
		const result = await repository.getTimeslotsScheduleById(1);
		expect(result).not.toBe(undefined);
		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.findOne).toBeCalledTimes(1);
	});

	it('should return null when id is falsy', async () => {
		const repository = Container.get(TimeslotItemsRepository);
		expect(await repository.getTimeslotsScheduleById(null)).toBe(null);
		expect(await repository.getTimeslotsScheduleById(undefined)).toBe(null);
		expect(await repository.getTimeslotsScheduleById(0)).toBe(null);
	});

	it('should populate TimeslotsSchedules in entities (IEntityWithTimeslotsSchedule)', async () => {
		const repository = Container.get(TimeslotItemsRepository);
		const entity1 = new SampleEntity();
		entity1.timeslotsScheduleId = 2;
		const entity2 = new SampleEntity();

		await repository.populateTimeslotsSchedules([entity1, entity2]);
		expect(InnerRepositoryMock.find).toHaveBeenCalled();
		expect(entity1.timeslotsSchedule).toBeDefined();
		expect(entity2.timeslotsSchedule).not.toBeDefined();
	});

	it('should not call DB when array is empty (not supported)', async () => {
		const repository = Container.get(TimeslotItemsRepository);
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

export const InnerRepositoryMock = {
	findOne: jest.fn().mockImplementation((...params) => {
		return Promise.resolve(timeslotsScheduleMock);
	}),
	find: jest.fn().mockImplementation((...params) => {
		return Promise.resolve([timeslotsScheduleMock]);
	}),
};


export const GetRepositoryMock = jest.fn().mockImplementation(() => InnerRepositoryMock);


export const DbConnectionMock = jest.fn().mockImplementation(() => {
	const getConnection = () => {
		const connection = {
			getRepository: GetRepositoryMock,
		};

		return Promise.resolve(connection);
	};

	return { getConnection };
});
