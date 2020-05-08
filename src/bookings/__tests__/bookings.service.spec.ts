import { BookingRequest, BookingsService } from "../index";
import { BookingsRepository } from "../bookings.repository";
import {CalendarsService} from "../../calendars/calendars.service";
import { Container } from "typescript-ioc";
import { Booking, BookingStatus } from "../../models/";
import { InsertResult } from "typeorm";

describe("Bookings.Service", () => {
	it("should get all bookings", async () => {
		Container.bind(BookingsRepository).to(BookingRepositoryMock);
		BookingRepositoryMock.getBookingsMock = [new Booking(new Date(), 60)];
		const result = await new BookingsService().getBookings();

		expect(result.length).toBe(1);
	});

	it("should save booking from booking request", async () => {
		Container.bind(BookingsRepository).to(BookingRepositoryMock);
		Container.bind(CalendarsService).to(CalendarsServiceMock);

		const bookingRequest: BookingRequest = new BookingRequest();
		await new BookingsService().save(bookingRequest);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.PendingApproval);
	});
});

class BookingRepositoryMock extends BookingsRepository {
	public static booking: Booking;
	public static getBookingsMock: Booking[];

	public async getBookings(): Promise<Booking[]> {
		return Promise.resolve(BookingRepositoryMock.getBookingsMock);
	}

	public async save(booking: Booking): Promise<InsertResult> {
		BookingRepositoryMock.booking = booking;
		return Promise.resolve(new InsertResult());
	}
}

class CalendarsServiceMock extends CalendarsService {
	public async validateTimeSlot(startTime: Date, sessionDuration: number) {
		return Promise.resolve();
	}

}
