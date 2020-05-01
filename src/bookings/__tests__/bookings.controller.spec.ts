import { Container } from "typescript-ioc";

import { Booking } from "../../models";

import { BookingsController } from "../bookings.controller";
import { BookingsResponse } from "../bookings.response";
import { BookingsService } from "../bookings.service";

describe("User.Controller", () => {
	it("should have http code 200", async () => {
		Container.bind(BookingsService).to(BookingsServiceMock);
		const controller = Container.get(BookingsController);
		const result = await controller.getBookings();

		expect(result).toBeTruthy();
	});

	it("should return the bookings from bookingsService", async () => {
		Container.bind(BookingsService).to(BookingsServiceMock);
		const bookings = [new Booking(new Date(), 60)];
		BookingsServiceMock.mockBookings = bookings;
		const controller = Container.get(BookingsController);
		const result = await controller.getBookings();

		expect(result).toStrictEqual(new BookingsResponse(bookings));
	});
});

class BookingsServiceMock extends BookingsService {
	public static mockBookings: Booking[];

	public async getBookings(): Promise<Booking[]> {
		return Promise.resolve(BookingsServiceMock.mockBookings);
	}
}
