import { TemplatesTimeslotsRepository } from '../templatesTimeslots.repository';
import { DbConnection } from '../../../core/db.connection';
import { Container, Snapshot } from 'typescript-ioc';
import { DbConnectionMock, GetRepositoryMock, InnerRepositoryMock } from '../../../infrastructure/tests/dbconnectionmock';
import { TemplateTimeslots } from "../../../models/templateTimeslots";

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

describe('TemplateTimeslots repository', () => {
	it('should get timeSlots', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);

		const repository = Container.get(TimeslotsRepository);
		const result = await repository.getTimeslots(true);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.find).toBeCalledTimes(1);
	});

	it('should add timeSlots', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);
		const timeslot = new TemplateTimeslots('test', new Date(), new Date(), 3);
		const repository = Container.get(TimeslotsRepository);
		const result = await repository.upsertTemplateTimeslots(timeslot);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.save).toBeCalledTimes(1);
	});

	it('should remove timeSlots', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);

		const repository = Container.get(TimeslotsRepository);
		const result = await repository.deleteTimeslot(34848);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.delete).toBeCalledTimes(1);
	});
});
