
import { TimeslotsRepository } from '../timeslots.repository';
import { DbConnection } from '../../core/db.connection';
import { Container, Snapshot } from 'typescript-ioc';
import { Calendar } from '../../models/calendar';
import { DbConnectionMock, GetRepositoryMock, InnerRepositoryMock } from '../../infrastructure/tests/dbconnectionmock';

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

describe('Timeslot repository', () => {
	it('should get timeSlots', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);

		const repository = Container.get(TimeslotsRepository);
		const result = await repository.getTimeslots(true);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.find).toBeCalledTimes(1);
	});
});
