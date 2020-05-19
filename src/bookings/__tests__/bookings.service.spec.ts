import { BookingsService } from "..";
import { BookingsRepository } from "../bookings.repository";
import { CalendarsService } from "../../calendars/calendars.service";
import { Container } from "typescript-ioc";
import { Booking, BookingStatus, Calendar } from "../../models/";
import { InsertResult, UpdateResult } from "typeorm";
import { BookingAcceptRequest, BookingRequest, BookingSearchRequest } from "../bookings.apicontract";
import { TimeslotsService } from '../../timeslots/timeslots.service';

describe("Bookings.Service", () => {
	beforeAll(() => {
		Container.bind(BookingsRepository).to(BookingRepositoryMock);
		Container.bind(CalendarsService).to(CalendarsServiceMock);
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
	});

	it("should get all bookings", async () => {
		BookingRepositoryMock.getBookingsMock = [new Booking(new Date(), 60)];
		const result = await new BookingsService().getBookings();

		expect(result.length).toBe(1);
	});

	it("should save booking from booking request", async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		BookingRepositoryMock.searchBookingsMock = [];
		CalendarsServiceMock.calendars = [new Calendar()];
		TimeslotsServiceMock.availableCalendarsForTimeslot = [new Calendar()];

		await Container.get(BookingsService).save(bookingRequest);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.PendingApproval);
	});

	it("should accept booking", async () => {
		const bookingService = Container.get(BookingsService);
		CalendarsServiceMock.eventId = "event-id";
		BookingRepositoryMock.booking = new Booking(new Date(), 60);
		const calendar = { id: 1, uuid: '123', googleCalendarId: "google-id-1" } as Calendar;
		CalendarsServiceMock.calendars = [calendar];
		TimeslotsServiceMock.availableCalendarsForTimeslot = [calendar];

		const acceptRequest = new BookingAcceptRequest();
		acceptRequest.calendarUUID = '123';
		const result = await bookingService.acceptBooking("1", acceptRequest);

		expect(result.status).toBe(BookingStatus.Accepted);
		expect(result.eventICalId).toBe("event-id");
	});

	it("should throw exception if booking not found", async () => {
		const bookingService = Container.get(BookingsService);
		BookingRepositoryMock.booking = undefined;
		expect(bookingService.getBooking("1")).rejects.toEqual(
			new Error("Booking 1 not found")
		);
	});

	it("should validate booking request", async () => {
		const bookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();

		const testCalendar = new Calendar();
		testCalendar.googleCalendarId = "google-id-1";
		CalendarsServiceMock.calendars = [new Calendar()];
		BookingRepositoryMock.searchBookingsMock = [new Booking(new Date(), 10)];

		const service = Container.get(BookingsService);
		expect(service.save(bookingRequest))
			.rejects
			.toStrictEqual(new Error('No available calendars for this timeslot'));
	});
});

class BookingRepositoryMock extends BookingsRepository {
	public static booking: Booking;
	public static getBookingsMock: Booking[];
	public static searchBookingsMock: Booking[];

	public async getBookings(): Promise<Booking[]> {
		return Promise.resolve(BookingRepositoryMock.getBookingsMock);
	}

	public async getBooking(id: string): Promise<Booking> {
		return Promise.resolve(BookingRepositoryMock.booking);
	}

	public async save(booking: Booking): Promise<InsertResult> {
		BookingRepositoryMock.booking = booking;
		return Promise.resolve(new InsertResult());
	}

	public async update(booking: Booking): Promise<UpdateResult> {
		return Promise.resolve(new UpdateResult());
	}

	public async search(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return Promise.resolve(BookingRepositoryMock.searchBookingsMock);
	}
}

class CalendarsServiceMock extends CalendarsService {
	public static calendars: Calendar[];
	public static eventId: string;

	public async validateTimeSlot(booking: Booking) {
		return Promise.resolve();
	}

	public async getCalendars(): Promise<Calendar[]> {
		return CalendarsServiceMock.calendars;
	}

	public async getCalendarByUUID(uuid: string): Promise<Calendar> {
		const calendar = new Calendar();
		calendar.id = 1;
		calendar.uuid = uuid;
		calendar.googleCalendarId = 'googleCalendarId';
		return calendar;
	}

	public async createEvent(booking: Booking): Promise<string> {
		return Promise.resolve(CalendarsServiceMock.eventId);
	}

	public async createCalendarEvent(booking: Booking, calendar: Calendar): Promise<string> {
		return Promise.resolve(CalendarsServiceMock.eventId);
	}

	public async getCalendarForBookingRequest(booking: Booking, calendarId: string): Promise<Calendar> {
		const calendar = new Calendar();
		calendar.id = 1;
		calendar.uuid = 'uuid';
		calendar.googleCalendarId = 'googleCalendarId';
		return calendar;
	}
}

class TimeslotsServiceMock extends TimeslotsService {
	public static availableCalendarsForTimeslot: Calendar[] = [];

	public async getAvailableCalendarsForTimeslot(startDateTime: Date, endDateTime: Date): Promise<Calendar[]> {
		return TimeslotsServiceMock.availableCalendarsForTimeslot;
	}
}
