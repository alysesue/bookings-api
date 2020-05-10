import {BookingRequest, BookingsService} from "..";
import {BookingsRepository} from "../bookings.repository";
import {CalendarsService} from "../../calendars/calendars.service";
import {Container} from "typescript-ioc";
import {Booking, BookingStatus, Calendar} from "../../models/";
import {InsertResult, UpdateResult} from "typeorm";
import {BookingAcceptRequest} from "../rest/booking.acceptRequest";

describe("Bookings.Service", () => {
	beforeAll(() => {
		Container.bind(BookingsRepository).to(BookingRepositoryMock);
		Container.bind(CalendarsService).to(CalendarsServiceMock);
	});

	it("should get all bookings", async () => {
		BookingRepositoryMock.getBookingsMock = [new Booking(new Date(), 60)];
		const result = await new BookingsService().getBookings();

		expect(result.length).toBe(1);
	});

	it("should save booking from booking request", async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		await Container.get(BookingsService).save(bookingRequest);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.PendingApproval);
	});

	it("should accept booking", async () => {
		const bookingService = Container.get(BookingsService);
		CalendarsServiceMock.eventId = "event-id";
		BookingRepositoryMock.booking = new Booking(new Date(), 60);
		CalendarsServiceMock.calendars = [
			{id: 1, googleCalendarId: "google-id-1"} as Calendar,
		];
		const acceptRequest = new BookingAcceptRequest();
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
});

class BookingRepositoryMock extends BookingsRepository {
	public static booking: Booking;
	public static getBookingsMock: Booking[];

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

	public async createEvent(booking: Booking): Promise<string> {
		return Promise.resolve(CalendarsServiceMock.eventId);
	}
}
