import { CalendarsRepository } from '../calendars.repository';
import { DbConnection } from '../../core/db.connection';
import { Container, Snapshot } from 'typescript-ioc';
import { Calendar } from '../../models';

let snapshot: Snapshot;
beforeAll(() => {
	// Store the IoC configuration
	snapshot = Container.snapshot();
});

afterEach(() => {
	// Put the IoC configuration back for IService, so other tests can run.
	snapshot.restore();

	// Clears mock counters, not implementation
	jest.clearAllMocks();
});

describe('Calendar service', () => {
	it('should get calendars', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);

		const calendarsRepository = new CalendarsRepository();
		const result = await calendarsRepository.getCalendars();
		expect(result).not.toBe(undefined);

		expect(getRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.find).toBeCalledTimes(1);
	});

	it('should get calendars with templates', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);

		const calendarsRepository = new CalendarsRepository();
		const result = await calendarsRepository.getCalendarsWithTemplates();
		expect(result).not.toBe(undefined);

		expect(getRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.find).toBeCalledTimes(1);
	});

	it('should get calendar by UUID', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);

		const calendarsRepository = new CalendarsRepository();
		const result = await calendarsRepository.getCalendarByUUID('uuid');
		expect(result).not.toBe(undefined);

		expect(getRepositoryMock).toBeCalled();
	});

	it('should save calendars', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);

		const calendarsRepository = new CalendarsRepository();
		const myCalendar = { uuid: 'uuid' } as Calendar;

		const result = await calendarsRepository.saveCalendar(myCalendar);
		expect(result).not.toBe(undefined);

		expect(getRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.save).toBeCalledTimes(1);
	});
});

const InnerRepositoryMock = {
	find: jest.fn().mockImplementation(() => Promise.resolve([])),
	save: jest.fn().mockImplementation(() => Promise.resolve({})),
	findOne: jest.fn().mockImplementation(() => Promise.resolve({}))
};

const getRepositoryMock = jest.fn().mockImplementation(() => InnerRepositoryMock);

const DbConnectionMock = jest.fn().mockImplementation(() => {
	const getConnection = () => {
		const connection = {
			getRepository: getRepositoryMock,
		};

		return Promise.resolve(connection);
	};

	return { getConnection };
});
