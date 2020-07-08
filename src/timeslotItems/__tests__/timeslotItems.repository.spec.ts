import { DbConnection } from '../../core/db.connection';
import { Container } from 'typescript-ioc';
import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../models';
import { TimeslotItemsRepository } from '../timeslotItems.repository';

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

});

const timeslotsScheduleMock = new TimeslotsSchedule();
timeslotsScheduleMock._id = 1;
timeslotsScheduleMock.timeslotItems = [TimeslotItem.create(1, 1, TimeOfDay.create({ hours: 11, minutes: 0 }), TimeOfDay.create({ hours: 11, minutes: 30 }))];

export const InnerRepositoryMock = {
	findOne: jest.fn().mockImplementation((...params) => {
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
