import { CalendarsRepository } from '../calendars.repository';
import { Container, Snapshot } from 'typescript-ioc';
import { Calendar } from '../../models/calendar';
import { CalendarsService } from '../calendars.service';
import { GoogleCalendarService } from "../../googleapi/google.calendar.service";

let snapshot: Snapshot;
beforeAll(() => {
	// Store the IoC configuration
	snapshot = Container.snapshot();

	Container.bind(CalendarsRepository).to(CalendarRepositoryMock);
	Container.bind(GoogleCalendarService).to(GoogleCalendarApiWrapperMock);

	// Clears mock counters, not implementation
	jest.clearAllMocks();
});

afterAll(() => {
	// Put the IoC configuration back for IService, so other tests can run.
	snapshot.restore();
});

describe('Calendar service', () => {

	it('should get calendars', async () => {
		const service = Container.get(CalendarsService);

		await service.getCalendars();
		expect(CalendarRepositoryObj.getCalendars).toBeCalled();
	});

	it('should save calendars', async () => {
		const service = Container.get(CalendarsService);

		await service.createCalendar({
			serviceProviderName: 'Jhon Doe'
		});

		expect(CalendarRepositoryObj.saveCalendar).toBeCalled();
	});

	it('should add user access', async () => {
		const service = Container.get(CalendarsService);

		const result = await service.addUser('uuid', { email: 'test@palo-it.com' });
		expect(result.email).not.toBe(undefined);

		expect(CalendarRepositoryObj.getCalendarByUUID).toHaveBeenCalled();
	});

	it('should return available calendars', async () => {
		const service = Container.get(CalendarsService);

		const calendars = [
			{
				googleCalendarId: 'google-id-1'
			} as Calendar,
			{
				googleCalendarId: 'google-id-2'
			} as Calendar,
		];

		const result = await service.getAvailableCalendarsForTimeSlot(new Date(), new Date(), calendars);

		expect(result).not.toBe(undefined);
	});

	it('should validate booking request', async () => {
		const testCalendar = new Calendar();
		testCalendar.googleCalendarId = 'google-id-1';

		const service = Container.get(CalendarsService);
		await service.validateTimeSlot(new Date(), 60);
	});
});

const CalendarObjMock = {
	id: 1,
	uuid: 'uuid',
	googleCalendarId: 'googleid@group.calendar.google.com'
} as Calendar;

const CalendarRepositoryObj = {
	getCalendars: jest.fn().mockImplementation(() => Promise.resolve([])),
	saveCalendar: jest.fn().mockImplementation((calendar) => Promise.resolve(calendar)),
	getCalendarByUUID: jest.fn().mockImplementation(() => Promise.resolve(CalendarObjMock))
};

const CalendarRepositoryMock = jest.fn().mockImplementation(() => CalendarRepositoryObj);

class GoogleCalendarApiWrapperMock extends GoogleCalendarService {

	constructor() {
		super();
		super.setToken('fake-token');
	}

	public async getAvailableGoogleCalendars(startTime: Date, endTime: Date, googleCalendarIds: { id: string }[]) {
		// @ts-ignore
		return {
			'google-id-1': { busy: [] },
			'google-id-2': { busy: [] }
		};
	}

	public async createCalendar(): Promise<string> {
		return 'google-id-1';
	}

	public async addCalendarUser(calendarId: string, user: { role: string, email: string }): Promise<string> {
		return user.email;
	}
}
