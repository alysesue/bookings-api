import { CalendarsRepository } from '../calendars.repository';
import { DbConnection } from '../../core/db.connection';
import { Container, Snapshot } from 'typescript-ioc';
import { Calendar } from '../../models/calendar';

let snapshot: Snapshot;
beforeAll(function () {
	// Store the IoC configuration
	snapshot = Container.snapshot();

	//Clears mock counters, not implementation
	jest.clearAllMocks();
});

afterAll(function () {
	// Put the IoC configuration back for IService, so other tests can run.
	snapshot.restore();
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

	it('should save calendars', async () => {
		Container.bind(DbConnection).to(DbConnectionMock);

		const calendarsRepository = new CalendarsRepository();
		const myCalendar = { uuid: 'lkjasdkl' } as Calendar;

		const result = await calendarsRepository.saveCalendar(myCalendar);
		expect(result).not.toBe(undefined);

		expect(getRepositoryMock).toBeCalled();
		expect(InnerRepositoryMock.save).toBeCalledTimes(1);
	});
});

const InnerRepositoryMock = {
	find: jest.fn().mockImplementation(() => Promise.resolve([])),
	save: jest.fn().mockImplementation(() => Promise.resolve({}))
};

const getRepositoryMock = jest.fn().mockImplementation(() => InnerRepositoryMock);

const DbConnectionMock = jest.fn().mockImplementation(() => {
	const getConnection = function () {
		const connection = {
			getRepository: getRepositoryMock,
		};

		return Promise.resolve(connection);
	};

	return { getConnection: getConnection };
});
