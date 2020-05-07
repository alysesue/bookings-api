import {Container} from "typescript-ioc";

import {Booking, BookingStatus} from "../../models";

import {BookingsController} from "../bookings.controller";
import {BookingResponse} from "../booking.response";
import {BookingsService} from "../bookings.service";

describe("Bookings.Controller", () => {
	it("should have http code 200", async () => {
		Container.bind(BookingsService).to(BookingsServiceMock);
		const controller = Container.get(BookingsController);
		const result = await controller.getBookings();

		expect(result).toBeTruthy();
	});

	it("should return the bookings from bookingsService", async () => {
		Container.bind(BookingsService).to(BookingsServiceMock);
		const bookingStartDate = new Date();
		const bookings = [new Booking(bookingStartDate, 60)];
		BookingsServiceMock.mockBookings = bookings;
		const controller = Container.get(BookingsController);
		const result = await controller.getBookings();

		const bookingResponse = new BookingResponse();
		bookingResponse.id = undefined;
		bookingResponse.startDateTime = bookingStartDate;
		bookingResponse.status = BookingStatus.PendingApproval;
		bookingResponse.sessionDurationInMinutes = 60;

		expect(result[0]).toEqual(bookingResponse);
	});

	it('should accept booking', async () => {
		Container.bind(BookingsService).to(BookingsServiceMock);
		const controller = Container.get(BookingsController);
		const bookingId = 'booking-1';
		const testBooking = new Booking(new Date(), 120);
		BookingsServiceMock.mockAcceptBooking = testBooking;

		await controller.acceptBooking(bookingId);

		expect(BookingsServiceMock.mockBookingId).toBe(bookingId);
	});
});

class BookingsServiceMock extends BookingsService {
	public static mockAcceptBooking: Booking;
	public static mockBookings: Booking[] = [];
	public static mockBookingId;

	public async getBookings(): Promise<Booking[]> {
		return Promise.resolve(BookingsServiceMock.mockBookings);
	}

	public async acceptBooking(bookingId: string): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return Promise.resolve(BookingsServiceMock.mockAcceptBooking);
	}
}
