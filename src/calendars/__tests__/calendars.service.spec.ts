import {CalendarsRepository} from '../calendars.repository';
import {Container, Snapshot} from 'typescript-ioc';
import {Booking, BookingStatus, Calendar} from '../../models';
import {CalendarsService} from '../calendars.service';
import {GoogleCalendarService} from "../../googleapi/google.calendar.service";
import {CalendarUserModel} from "../calendars.apicontract";

let snapshot: Snapshot;

describe('Calendar service', () => {
	beforeAll(() => {
		// Store the IoC configuration
		snapshot = Container.snapshot();
	});

	afterEach(() => {
		snapshot.restore();
	});

	beforeEach(() => {
		// Clears mock counters, not implementation
		jest.clearAllMocks();
	});
	it('should get calendars', async () => {
		Container.bind(CalendarsRepository).to(CalendarRepositoryMock);
		Container.bind(GoogleCalendarService).to(GoogleCalendarApiWrapperMock);

		const service = Container.get(CalendarsService);

		await service.getCalendars();
		expect(CalendarRepositoryObj.getCalendars).toBeCalled();
	});

	it('should save calendars', async () => {
		Container.bind(CalendarsRepository).to(CalendarRepositoryMock);
		Container.bind(GoogleCalendarService).to(GoogleCalendarApiWrapperMock);

		const service = Container.get(CalendarsService);

		await service.createCalendar();
		expect(CalendarRepositoryObj.saveCalendar).toBeCalled();
	});

	it('should add user access', async () => {
		Container.bind(CalendarsRepository).to(CalendarRepositoryMock);
		Container.bind(GoogleCalendarService).to(GoogleCalendarApiWrapperMock);
		const service = Container.get(CalendarsService);

		const result = await service.addUser('uuid', {email: 'test@palo-it.com'} as CalendarUserModel);
		expect(result.email).not.toBe(undefined);

		expect(CalendarRepositoryObj.getCalendarByUUID).toHaveBeenCalled();
	});

	it('should return available calendars', async () => {
		Container.bind(CalendarsRepository).to(CalendarRepositoryMockConstants);
		Container.bind(GoogleCalendarService).to(GoogleCalendarApiWrapperMock);

		const service = Container.get(CalendarsService);
		const booking = new Booking(new Date(), 60);

		const calendars = [
			{
				googleCalendarId: 'google-id-1'
			} as Calendar,
			{
				googleCalendarId: 'google-id-2'
			} as Calendar,
		];

		const result = await service.getAvailableCalendarsForTimeSlot(booking, calendars);

		expect(result).not.toBe(undefined);
	});

	it('should validate booking request', async () => {
		Container.bind(CalendarsRepository).to(CalendarRepositoryMockConstants);
		Container.bind(GoogleCalendarService).to(GoogleCalendarApiWrapperMock);

		const testCalendar = new Calendar();
		testCalendar.googleCalendarId = 'google-id-1';
		CalendarRepositoryMockConstants.calendars = [testCalendar];
		const service = Container.get(CalendarsService);
		await service.validateTimeSlot(new Booking(new Date(), 60));
	});

	it('should create event to the calendar', async () => {
		Container.bind(CalendarsRepository).to(CalendarRepositoryMockConstants);
		Container.bind(GoogleCalendarService).to(GoogleCalendarApiWrapperMock);

		const service = Container.get(CalendarsService);
		const booking = new Booking(new Date(), 60);
		booking.status = BookingStatus.Accepted;

		await service.createEvent(booking);
	});
});

const CalendarObjMock = {
	id: 1,
	uuid: 'uuid',
	googleCalendarId: 'googleid@group.calendar.google.com'
} as Calendar;

const CalendarRepositoryObj = {
	getCalendars: jest.fn().mockImplementation(() => Promise.resolve(CalendarRepositoryMockConstants.calendars)),
	saveCalendar: jest.fn().mockImplementation((calendar) => Promise.resolve(calendar)),
	getCalendarByUUID: jest.fn().mockImplementation(() => Promise.resolve(CalendarObjMock))
};

const CalendarRepositoryMock = jest.fn().mockImplementation(() => CalendarRepositoryObj);

class CalendarRepositoryMockConstants {
	public static calendars: Calendar[];
}

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

	public async addCalendarUser(calendarId: string, user: { role: string, email: string }): Promise<CalendarUserModel> {
		return Promise.resolve({email: user.email} as CalendarUserModel);

	}
}
