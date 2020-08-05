import { SchedulesRepository } from '../schedules.repository';
import { WeekDayBreakRepository } from '../weekdaybreak.repository';
import { DbConnection } from '../../core/db.connection';
import { Container, Snapshot } from 'typescript-ioc';
import { Schedule } from "../../models";

let snapshot: Snapshot;
beforeAll(() => {
	// Store the IoC configuration
	snapshot = Container.snapshot();

	// Clears mock counters, not implementation
	jest.clearAllMocks();
});

afterAll(() => {
	// Put the IoC configuration back, so other tests can run.
	snapshot.restore();
});

beforeEach(() => {
	Container.bind(DbConnection).to(DbConnectionMock);
	Container.bind(WeekDayBreakRepository).to(jest.fn(() => WeekDayBreakRepositoryMock));

	jest.clearAllMocks();
});

const NullScheduleId = 55;
describe('Schedule repository', () => {
	it('should get schedules', async () => {
		const repository = Container.get(SchedulesRepository);
		const result = await repository.getSchedules();
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.find).toBeCalledTimes(1);
	});

	it('should get schedules with id', async () => {
		const repository = Container.get(SchedulesRepository);
		const result = await repository.getScheduleById(1);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.findOne).toBeCalledTimes(1);
	});

	it('should return null when schedule not found', async () => {
		const repository = Container.get(SchedulesRepository);
		const result = await repository.getScheduleById(NullScheduleId);
		expect(result).toBe(null);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.findOne).toBeCalledTimes(1);
	});

	it('should get schedules with name', async () => {
		const repository = Container.get(SchedulesRepository);
		const result = await repository.getScheduleByName('test');
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.findOne).toBeCalledTimes(1);
	});

	it('should add schedules', async () => {
		const schedule = new Schedule();
		schedule.id = 2;
		schedule.initWeekdaySchedules();

		const repository = Container.get(SchedulesRepository);
		const result = await repository.saveSchedule(schedule);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.save).toBeCalledTimes(1);
	});

	it('should remove schedules', async () => {
		const repository = Container.get(SchedulesRepository);
		const result = await repository.deleteSchedule(34848);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.delete).toBeCalledTimes(1);
	});
});

const WeekDayBreakRepositoryMock = {
	getBreaksForSchedules: jest.fn(() => Promise.resolve([])),
	deleteBreaksForSchedule: jest.fn(() => Promise.resolve({})),
	save: jest.fn(() => Promise.resolve([]))
};


const scheduleMock = new Schedule();
scheduleMock.id = 1;
scheduleMock.name = 'test';
scheduleMock.initWeekdaySchedules();

export const InnerRepositoryMock = {
	findOne: jest.fn().mockImplementation((...params) => {
		if (params.length === 2 && params[0] === NullScheduleId) {
			return Promise.resolve(null);
		}

		return Promise.resolve(scheduleMock);
	}),
	find: jest.fn().mockImplementation(() => Promise.resolve([scheduleMock])),
	save: jest.fn().mockImplementation(() => Promise.resolve(scheduleMock)),
	delete: jest.fn().mockImplementation(() => Promise.resolve({}))
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
