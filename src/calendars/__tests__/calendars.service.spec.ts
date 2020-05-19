import { CalendarsRepository } from "../calendars.repository";
import { Container, Snapshot } from "typescript-ioc";
import { Booking, BookingStatus, Calendar } from "../../models";
import { CalendarsService } from "../calendars.service";
import { GoogleCalendarService } from "../../googleapi/google.calendar.service";
import { CalendarTemplatesTimeslotModel, CalendarUserModel } from "../calendars.apicontract";
import { TemplatesTimeslotsRepository } from "../../components/templatesTimeslots/templatesTimeslots.repository";

let snapshot: Snapshot;

describe("Calendar service", () => {
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
		Container.bind(CalendarsRepository).to(CalendarRepositoryMock);
		Container.bind(TemplatesTimeslotsRepository).to(TemplatesTimeslotsRepositoryMock);
		Container.bind(GoogleCalendarService).to(GoogleCalendarServiceMock);
	});
	it("should get calendars", async () => {
		const service = Container.get(CalendarsService);

		await service.getCalendars();
		expect(CalendarRepositoryObj.getCalendars).toBeCalled();
	});

	it("should save calendars", async () => {
		const service = Container.get(CalendarsService);

		await service.createCalendar({
			serviceProviderName: 'Jhon Doe'
		});

		expect(CalendarRepositoryObj.saveCalendar).toBeCalled();
	});

	it("should link calendars with templatestimelot", async () => {
		const service = Container.get(CalendarsService);

		await service.addTemplatesTimeslots("uuid", {
			templatesTimeslotId: 3,
		} as CalendarTemplatesTimeslotModel);

		expect(CalendarRepositoryObj.saveCalendar).toBeCalled();
		expect(TemplatesTimeslotsRepositoryObj.getTemplateTimeslotsById).toBeCalled();
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
		const booking = new Booking(new Date(), 60);

		const calendars = [
			{
				googleCalendarId: "googleid@group.calendar.google.com",
			} as Calendar,
		];

		const result = await service.getAvailableCalendarsForTimeSlot(
			booking.startDateTime,
			booking.getSessionEndTime(),
			calendars
		);

		expect(result).not.toBe(undefined);
	});

	it("should create event to the calendar", async () => {
		CalendarRepositoryMockConstants.eventId = "event-id";

		const service = Container.get(CalendarsService);
		const booking = new Booking(new Date(), 60);
		booking.status = BookingStatus.Accepted;

		const eventId = await service.createEvent(booking, '1');

		expect(eventId).toBe("event-id");
	});

	it('should throw exception if no calendar for uuid', async () => {
		CalendarRepositoryObj.getCalendarByUUID.mockReturnValue(undefined);
		const service = Container.get(CalendarsService);
		expect(service.createEvent(new Booking(new Date(), 111), '1')).rejects
			.toStrictEqual(new Error('Calendar 1 does not exist'));
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

const TemplatesTimeslotsRepositoryObj = {
	getTemplateTimeslotsById: jest
		.fn()
		.mockImplementation(() =>
			Promise.resolve({})
		),
};

const TemplatesTimeslotsRepositoryMock = jest
	.fn()
	.mockImplementation(() => TemplatesTimeslotsRepositoryObj);

const CalendarRepositoryMock = jest
	.fn()
	.mockImplementation(() => CalendarRepositoryObj);

class CalendarRepositoryMockConstants {
	public static calendars: Calendar[];
	public static eventId: string;
}

class GoogleCalendarServiceMock extends GoogleCalendarService {
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
}
