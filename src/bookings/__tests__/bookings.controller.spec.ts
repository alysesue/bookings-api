import { Container } from "typescript-ioc";
import { Booking, BookingStatus } from "../../models";
import { BookingsController } from "../bookings.controller";
import { BookingsService } from "../bookings.service";
import { BookingResponse, BookingSearchRequest } from "../bookings.apicontract";
import { TimeslotsService } from '../../timeslots/timeslots.service';

describe("Bookings.Controller", () => {
	beforeAll(() => {
		Container.bind(BookingsService).to(BookingsServiceMock);
		Container.bind(TimeslotsService).to(jest.fn(() => TimeslotsServiceMock));
	});

	it("should have http code 200", async () => {

		const controller = Container.get(BookingsController);
		const result = await controller.getBookings();

		expect(result).toBeTruthy();
	});

	it("should return the bookings from bookingsService", async () => {
		const bookingStartDate = new Date();
		const booking = new Booking(bookingStartDate, 60);
		BookingsServiceMock.mockBookings = [booking];
		const controller = Container.get(BookingsController);
		const result = await controller.getBookings();

		const bookingResponse = new BookingResponse();
		bookingResponse.id = undefined;
		bookingResponse.startDateTime = bookingStartDate;
		bookingResponse.status = BookingStatus.PendingApproval;
		bookingResponse.sessionDurationInMinutes = 60;
		bookingResponse.endDateTime = booking.getSessionEndTime();

		expect(result[0]).toEqual(bookingResponse);
	});

	it('should accept booking', async () => {
		const controller = Container.get(BookingsController);
		const bookingId = 'booking-1';
		BookingsServiceMock.mockAcceptBooking = new Booking(new Date(), 120);

		await controller.acceptBooking(bookingId, undefined);

		expect(BookingsServiceMock.mockBookingId).toBe(bookingId);
	});

	it('should search bookings', async () => {
		BookingsServiceMock.mockSearchBookings = [new Booking(new Date(), 120)];
		const from = new Date('2020-05-16T20:25:43.511Z');
		const to = new Date('2020-05-16T21:25:43.511Z');
		const controller = Container.get(BookingsController);

		const result = await controller.searchBookings(0, from, to);

		expect(result).toHaveLength(1);
	});

	it('should return one booking', async () => {
		const controller = Container.get(BookingsController);
		const testTime = new Date('2020-05-16T20:25:43.511Z');

		BookingsServiceMock.mockGetBooking = new Booking(testTime, 120);

		const result = await controller.getBooking("booking-id-1");

		expect(result.startDateTime).toBe(testTime);
		expect(result.status).toBe(0);
	});

	it('should get booking providers', async () => {
		const controller = Container.get(BookingsController);
		const testTime = new Date('2020-05-16T20:25:43.511Z');

		BookingsServiceMock.mockGetBooking = new Booking(testTime, 120);

		const result = await controller.getBookingProviders("booking-id-1");

		expect(result).toBeDefined();
		expect(TimeslotsServiceMock.getAvailableCalendarsForTimeslot).toBeCalled();
	});
});

const TimeslotsServiceMock = {
	getAvailableCalendarsForTimeslot: jest.fn(() => Promise.resolve([]))
};

class BookingsServiceMock extends BookingsService {
	public static mockAcceptBooking: Booking;
	public static mockGetBooking: Booking;
	public static mockBookings: Booking[] = [];
	public static mockSearchBookings: Booking[] = [];
	public static mockBookingId;

	public async getBooking(bookingId: string): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return Promise.resolve(BookingsServiceMock.mockGetBooking);
	}
	public async getBookings(): Promise<Booking[]> {
		return Promise.resolve(BookingsServiceMock.mockBookings);
	}

	public async acceptBooking(bookingId: string): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return Promise.resolve(BookingsServiceMock.mockAcceptBooking);
	}

	public async searchBookings(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return Promise.resolve(BookingsServiceMock.mockSearchBookings);
	}
}
