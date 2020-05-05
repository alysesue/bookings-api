import { Container } from "typescript-ioc";

import {Booking, BookingStatus} from "../../models";

import { BookingsController } from "../bookings.controller";
import {BookingResponse} from "../booking.response";
import { BookingsService } from "../bookings.service";

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
});

class BookingsServiceMock extends BookingsService {
	public static mockBookings: Booking[] = [];

	public async getBookings(): Promise<Booking[]> {
		return Promise.resolve(BookingsServiceMock.mockBookings);
	}
}
