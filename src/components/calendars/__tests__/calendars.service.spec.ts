import { CalendarsRepository } from "../calendars.repository";
import { Container } from "typescript-ioc";
import { Booking, Calendar } from "../../../models";
import { CalendarsService } from "../calendars.service";
import { GoogleCalendarService } from "../../../googleapi/google.calendar.service";
import { CalendarUserModel } from "../calendars.apicontract";
import { SchedulesRepository } from "../../schedules/schedules.repository";
import { BookingBuilder } from "../../../models/entities/booking";

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe("Calendar service", () => {
	afterEach(() => {

	});

	beforeEach(() => {
		// Clears mock counters, not implementation
		jest.clearAllMocks();
		Container.bind(CalendarsRepository).to(CalendarRepositoryMock);
		Container.bind(SchedulesRepository).to(SchedulesRepositoryMock);
		Container.bind(GoogleCalendarService).to(GoogleCalendarServiceMock);
	});
	it("should get calendars", async () => {
		const service = Container.get(CalendarsService);

		await service.getCalendars();
		expect(CalendarRepositoryObj.getCalendars).toBeCalled();
	});

	it("should save calendars", async () => {
		const service = Container.get(CalendarsService);

		await service.createCalendar();

		expect(CalendarRepositoryObj.saveCalendar).toBeCalled();
	});

	it("should add user access", async () => {
		const service = Container.get(CalendarsService);

		const result = await service.addUser("uuid", {
			email: "test@palo-it.com",
		} as CalendarUserModel);
		expect(result.email).not.toBe(undefined);

		expect(CalendarRepositoryObj.getCalendarByUUID).toHaveBeenCalled();
	});

	it("should return available calendars", async () => {
		const service = Container.get(CalendarsService);
		const booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		const calendars = [
			{
				googleCalendarId: "googleid@group.calendar.google.com",
			} as Calendar,
		];

		const result = await service.getAvailableGoogleCalendarsForTimeSlot(
			booking.startDateTime,
			booking.endDateTime,
			calendars
		);

		expect(result).not.toBe(undefined);
	});

	it('should delete calendar', async () => {
		const service = Container.get(CalendarsService);
		const calendar = {
			googleCalendarId: "googleid@group.calendar.google.com",
		} as Calendar;

		const calendarEventICalId = 'mpg1ahbqv20q4s6m2h3kriutr0@google.com';

		await service.deleteCalendarEvent(calendar, calendarEventICalId);

		expect(GoogleCalendarServiceMock.deleteEvent.mock.calls[0][0]).toBe('googleid@group.calendar.google.com');
		expect(GoogleCalendarServiceMock.deleteEvent.mock.calls[0][1]).toBe('mpg1ahbqv20q4s6m2h3kriutr0');
	});
});

const CalendarObjMock = {
	id: 1,
	uuid: "uuid",
	googleCalendarId: "googleid@group.calendar.google.com",
} as Calendar;

const CalendarRepositoryObj = {
	getCalendars: jest
		.fn()
		.mockImplementation(() =>
			Promise.resolve(CalendarRepositoryMockConstants.calendars)
		),
	saveCalendar: jest
		.fn()
		.mockImplementation((calendar) => Promise.resolve(calendar)),
	getCalendarByUUID: jest
		.fn()
		.mockImplementation(() => Promise.resolve(CalendarObjMock)),
	createEvent: jest
		.fn()
		.mockImplementation(() =>
			Promise.resolve(CalendarRepositoryMockConstants.eventId)
		),
};

const SchedulesRepositoryObj = {
	getScheduleById: jest
		.fn()
		.mockImplementation(() =>
			Promise.resolve({})
		),
};

const SchedulesRepositoryMock = jest
	.fn()
	.mockImplementation(() => SchedulesRepositoryObj);

const CalendarRepositoryMock = jest
	.fn()
	.mockImplementation(() => CalendarRepositoryObj);

class CalendarRepositoryMockConstants {
	public static calendars: Calendar[];
	public static eventId: string;
}

class GoogleCalendarServiceMock extends GoogleCalendarService {
	static deleteEvent = jest.fn();

	constructor() {
		super();
	}

	public async getAvailableGoogleCalendars(
		startTime: Date,
		endTime: Date,
		googleCalendarIds: { id: string }[]
	) {
		// @ts-ignore
		return {
			"google-id-1": { busy: [] },
			"googleid@group.calendar.google.com": { busy: [] },
		};
	}

	public async createCalendar(): Promise<string> {
		return "google-id-1";
	}

	public async addCalendarUser(
		calendarId: string,
		user: { role: string; email: string }
	): Promise<CalendarUserModel> {
		return Promise.resolve({ email: user.email } as CalendarUserModel);
	}

	public async createEvent(
		booking: Booking,
		calendarId: string
	): Promise<string> {
		return Promise.resolve("event-id");
	}

	public async deleteEvent(calendarId: string, eventId: string) {
		return GoogleCalendarServiceMock.deleteEvent(calendarId, eventId);
	}
}
