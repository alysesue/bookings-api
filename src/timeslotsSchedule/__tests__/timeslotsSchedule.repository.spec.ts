import { DbConnection } from '../../core/db.connection';
import { Container } from 'typescript-ioc';
import { TimeslotsSchedule, NewTimeslot, TimeOfDay } from '../../models';
import { TimeslotsScheduleRepository } from '../timeslotsSchedule.repository';

beforeEach(() => {
	Container.bind(DbConnection).to(DbConnectionMock);
	jest.clearAllMocks();
});

const NullTimeslotsScheduleId = 23;

describe('TimeslotsSchedule repository', () => {
	it('should get timeslotsSchedule', async () => {
		const repository = Container.get(TimeslotsScheduleRepository);
		const result = await repository.getTimeslotsScheduleById(1);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.findOne).toBeCalledTimes(1);
	});

	it('should return null when schedule not found', async () => {
		const repository = Container.get(TimeslotsScheduleRepository);
		const result = await repository.getTimeslotsScheduleById(NullTimeslotsScheduleId);
		expect(result).toBe(null);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.findOne).toBeCalledTimes(1);
	});
});

const timeslotsScheduleMock = new TimeslotsSchedule();
timeslotsScheduleMock._timeslotsScheduleId = 1;
timeslotsScheduleMock.timeslot = [NewTimeslot.create(1, 1, TimeOfDay.create({ hours: 11, minutes: 0 }), TimeOfDay.create({ hours: 11, minutes: 30 }))]



export const InnerRepositoryMock = {
	findOne: jest.fn().mockImplementation((...params) => {
		if (params.length === 2 && params[0] === NullTimeslotsScheduleId) {
			return Promise.resolve(null);
		}

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
