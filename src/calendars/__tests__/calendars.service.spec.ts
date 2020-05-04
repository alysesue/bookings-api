import { CalendarsRepository } from '../calendars.repository';
import { Container, Snapshot, ObjectFactory } from 'typescript-ioc';
import { Calendar } from '../../models/calendar';
import { CalendarsService } from '../calendars.service'

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
		Container.bind(CalendarsRepository).to(CalendarRepositoryMock);
		const service = Container.get(CalendarsService);

		const result = await service.getCalendars();
		expect(CalendarRepositoryObj.getCalendars).toBeCalled();
	});

	it('should save calendars', async () => {
		Container.bind(CalendarsRepository).to(CalendarRepositoryMock);
		const service = Container.get(CalendarsService);

		const result = await service.createCalendar();
		expect(CalendarRepositoryObj.saveCalendar).toBeCalled();
	});
});

const CalendarRepositoryObj = {
	getCalendars: jest.fn().mockImplementation(() => Promise.resolve([])),
	saveCalendar: jest.fn().mockImplementation(() => Promise.resolve({}))
};
const CalendarRepositoryMock = jest.fn().mockImplementation(() => CalendarRepositoryObj);

