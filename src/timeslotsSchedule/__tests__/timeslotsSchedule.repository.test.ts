import { DbConnection } from '../../core/db.connection';
import { Container } from 'typescript-ioc';
import { TimeslotsSchedule, NewTimeslot } from '../../models';

beforeEach(() => {
	Container.bind(DbConnection).to(DbConnectionMock);
	jest.clearAllMocks();
});

describe('TimeslotsSchedule repository', () => {
	it('should get timeslotsSchedule', async () => {

	});
});

const timeslotsScheduleMock = new TimeslotsSchedule();
timeslotsScheduleMock._timeslotsScheduleId = 1;
timeslotsScheduleMock.timeslot = [new NewTimeslot()]



export const InnerRepositoryMock = {
	findOne: jest.fn().mockImplementation(() => {
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
