import { DbConnection } from '../../core/db.connection';
import { Container } from 'typescript-ioc';
import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../models';
import { TimeslotsScheduleRepository } from '../timeslotsSchedule.repository';
import { TimeslotItemsRepository } from '../timeslotItems.repository';
import { IEntityWithTimeslotsSchedule, ITimeslotsSchedule } from '../../models/interfaces';

beforeEach(() => {
	Container.bind(DbConnection).to(DbConnectionMock);
	jest.clearAllMocks();
});

describe('TimeslotItems repository', () => {
	it('should save TimeslotItems', async () => {
		const repository = Container.get(TimeslotItemsRepository);
		const data = TimeslotItem.create(1, 0, TimeOfDay.parse("08:00"), TimeOfDay.parse("09:00"));
		const result = await repository.saveTimeslotItem(data);
		expect(result).not.toBe(undefined);
		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.save).toBeCalledTimes(1);
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

const timeslotItemMock = TimeslotItem.create(1, 1, TimeOfDay.create({ hours: 8, minutes: 0 }), TimeOfDay.create({ hours: 9, minutes: 0 }));
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


const timeslotItemMock = TimeslotItem.create(1, 1, TimeOfDay.create({ hours: 8, minutes: 0 }), TimeOfDay.create({ hours: 9, minutes: 0 }));

export const InnerRepositoryMock = {
	save: jest.fn().mockImplementation(() => {
		return Promise.resolve(timeslotItemMock);
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
