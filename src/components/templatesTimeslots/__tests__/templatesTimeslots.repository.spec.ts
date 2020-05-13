import {TemplatesTimeslotsRepository} from '../templatesTimeslots.repository';
import {DbConnection} from '../../../core/db.connection';
import {Container, Snapshot} from 'typescript-ioc';
import {DbConnectionMock, GetRepositoryMock, InnerRepositoryMock} from '../../../infrastructure/tests/dbconnectionmock';
import {TemplateTimeslots} from "../../../models/templateTimeslots";

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

describe('TemplateTimeslots repository', () => {
	it('should get timeSlots with id', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);

		const repository = Container.get(TemplatesTimeslotsRepository);
		const result = await repository.getTemplateTimeslotsById(3);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.findOne).toBeCalledTimes(1);
	});

	it('should get timeSlots with name', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);

		const repository = Container.get(TemplatesTimeslotsRepository);
		const result = await repository.getTemplateTimeslotsByName('test');
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.findOne).toBeCalledTimes(1);
	});

	it('should add timeSlots', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);
		const timeslot = new TemplateTimeslots();
		const repository = Container.get(TemplatesTimeslotsRepository);
		const result = await repository.setTemplateTimeslots(timeslot);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.save).toBeCalledTimes(1);
	});

	it('should remove timeSlots', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);

		const repository = Container.get(TemplatesTimeslotsRepository);
		const result = await repository.deleteTemplateTimeslots(34848);
		expect(result).not.toBe(undefined);

		expect(GetRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.delete).toBeCalledTimes(1);
	});
});
