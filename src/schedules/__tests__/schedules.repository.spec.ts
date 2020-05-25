import { SchedulesRepository } from '../schedules.repository';
import { DbConnection } from '../../core/db.connection';
import { Container, Snapshot } from 'typescript-ioc';
import { DbConnectionMock, GetRepositoryMock, InnerRepositoryMock } from '../../infrastructure/tests/dbconnectionmock';
import { Schedule } from "../../models/Schedule";

let snapshot: Snapshot;
beforeAll(() => {
	// Store the IoC configuration
	snapshot = Container.snapshot();

	// Clears mock counters, not implementation
	jest.clearAllMocks();
});

afterAll(() => {
	// Put the IoC configuration back for IService, so other tests can run.
	snapshot.restore();
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe('Schedule repository', () => {
	it('should get timeSlots with id', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);

		const repository = Container.get(SchedulesRepository);
		const result = await repository.getScheduleById(3);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.findOne).toBeCalledTimes(1);
	});

	it('should get timeSlots with name', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);

		const repository = Container.get(SchedulesRepository);
		const result = await repository.getScheduleByName('test');
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.findOne).toBeCalledTimes(1);
	});

	it('should add timeSlots', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);
		const timeslot = new Schedule();
		const repository = Container.get(SchedulesRepository);
		const result = await repository.setSchedule(timeslot);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.save).toBeCalledTimes(1);
	});

	it('should remove timeSlots', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);

		const repository = Container.get(SchedulesRepository);
		const result = await repository.deleteSchedule(34848);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.delete).toBeCalledTimes(1);
	});
});
