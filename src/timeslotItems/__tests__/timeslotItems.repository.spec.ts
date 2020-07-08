import { DbConnection } from '../../core/db.connection';
import { Container } from 'typescript-ioc';
import { TimeslotsSchedule, TimeslotItem, TimeOfDay } from '../../models';
import { TimeslotItemsRepository } from '../timeslotItems.repository';

beforeEach(() => {
	Container.bind(DbConnection).to(DbConnectionMock);
	jest.clearAllMocks();
});

describe('TimeslotsSchedule repository', () => {
	it('should get timeslotsSchedule', async () => {
		const repository = Container.get(TimeslotItemsRepository);
		const result = await repository.getTimeslotsScheduleById({ timeslotsScheduleId: 1 });
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.find).toBeCalledTimes(1);
	});

});

const timeslotsScheduleMock = new TimeslotsSchedule();
timeslotsScheduleMock._timeslotsScheduleId = 1;
timeslotsScheduleMock.timeslot = [TimeslotItem.create(1, 1, TimeOfDay.create({ hours: 11, minutes: 0 }), TimeOfDay.create({ hours: 11, minutes: 30 }))]



export const InnerRepositoryMock = {
	find: jest.fn().mockImplementation((...params) => {
		return Promise.resolve(timeslotsScheduleMock);
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
