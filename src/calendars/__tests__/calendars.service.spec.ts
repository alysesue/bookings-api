import { CalendarsRepository } from '../calendars.repository';
import {Container, Snapshot} from 'typescript-ioc';
import { Calendar } from '../../models/calendar';
import {CalendarsService} from '../calendars.service';
import {GoogleCalendarService} from "../../googleapi/google.calendar.service";

let snapshot: Snapshot;

describe('Calendar service', () => {
	beforeAll(() => {
		// Store the IoC configuration
		Container.bind(GoogleCalendarService).to(GoogleCalendarApiWrapperMock);
		snapshot = Container.snapshot();
	});

	afterEach(() => {
		// Put the IoC configuration back for IService, so other tests can run.
		snapshot.restore();
	});

	beforeEach(() => {
		// Clears mock counters, not implementation
		jest.clearAllMocks();
	});
	it('should get calendars', async () => {
		Container.bind(CalendarsRepository).to(CalendarRepositoryMock);
		const service = Container.get(CalendarsService);

		await service.getCalendars();
		expect(CalendarRepositoryObj.getCalendars).toBeCalled();
	});

	it('should save calendars', async () => {
		Container.bind(CalendarsRepository).to(CalendarRepositoryMock);
		const service = Container.get(CalendarsService);

		await service.createCalendar();
		expect(CalendarRepositoryObj.saveCalendar).toBeCalled();
	});

	it('should return available calendars', async () => {
		Container.bind(CalendarsRepository).to(CalendarRepositoryMock);
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
		Container.bind(CalendarsRepository).to(CalendarRepositoryMockClass);
		const testCalendar = new Calendar();
		testCalendar.googleCalendarId = 'google-id-1';
		CalendarRepositoryMockClass.calendars = [];
		const service = Container.get(CalendarsService);
		await service.validateTimeSlot(new Date(), 60);
	});
});

const CalendarRepositoryObj = {
	getCalendars: jest.fn().mockImplementation(() => Promise.resolve([])),
	saveCalendar: jest.fn().mockImplementation(() => Promise.resolve({}))
};
const CalendarRepositoryMock = jest.fn().mockImplementation(() => CalendarRepositoryObj);

class CalendarRepositoryMockClass extends CalendarsRepository {
	public static calendars: Calendar[];

	public async getCalendars(): Promise<Calendar[]> {
		return Promise.resolve(CalendarRepositoryMockClass.calendars);
	}

	public async saveCalendar(calendar: Calendar): Promise<Calendar> {
		return Promise.resolve(calendar);
	}
}


class GoogleCalendarApiWrapperMock extends GoogleCalendarService {

	constructor() {
		super();
		super.setToken('fake-token');
	}

	public async getAvailableGoogleCalendars(startTime: Date, endTime: Date, googleCalendarIds: { id: string }[]) {
		// @ts-ignore
		return Promise.resolve({
			'google-id-1': {busy: []},
			'google-id-2': {busy: []}
		});
	}

	public async createCalendar(): Promise<string> {
		return Promise.resolve('google-id-1');
	}
}
