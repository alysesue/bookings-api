import { Container } from "typescript-ioc";
import { Booking, BookingStatus, Calendar } from "../../models";
import { BookingsController } from "../bookings.controller";
import { BookingsService } from "../bookings.service";
import { BookingAcceptRequest, BookingRequest, BookingResponse, BookingSearchRequest } from "../bookings.apicontract";
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { ErrorResponse } from "../../apicontract";

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
		BookingsServiceMock.mockAcceptBooking = Promise.resolve(new Booking(new Date(), 120));

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

		BookingsServiceMock.getBookingPromise = Promise.resolve(new Booking(testTime, 120));

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

	it('should throw exception if booking not found', async () => {
		const controller = Container.get(BookingsController);
		BookingsServiceMock.getBookingPromise = Promise.reject({ message: 'error' });

		const result = await controller.getBooking("1");

		expect(result).toStrictEqual(new ErrorResponse('error'));
	});

	it('should throw exception if booking not found', async () => {
		const controller = Container.get(BookingsController);
		BookingsServiceMock.getBookingPromise = Promise.reject({ message: 'error' });

		const result = await controller.getBookingProviders("1");

		expect(result).toStrictEqual(new ErrorResponse('error'));
	});

	it('should post booking', async () => {
		const controller = Container.get(BookingsController);

		const result = await controller.postBooking(new BookingRequest());

		expect(result as BookingResponse);
	});

	it('should return 400 on post booking error', async () => {
		const controller = Container.get(BookingsController);
		BookingsServiceMock.mockPostBooking = Promise.reject({ message: 'error' });

		const result = await controller.postBooking(new BookingRequest());

		expect(result as ErrorResponse);
	});

	it('should return 400 on accept booking error', async () => {
		BookingsServiceMock.mockAcceptBooking = Promise.reject({ message: 'error' });

		const result = await Container.get(BookingsController).acceptBooking('1', new BookingAcceptRequest());

		expect(result as ErrorResponse);
	});
});

const TimeslotsServiceMock = {
	getAvailableCalendarsForTimeslot: jest.fn(() => Promise.resolve([new Calendar()]))
};

class BookingsServiceMock extends BookingsService {
	public static mockBooking: Booking;
	public static mockAcceptBooking = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockGetBooking: Booking;
	public static mockPostBooking = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockBookings: Booking[] = [];
	public static mockSearchBookings: Booking[] = [];
	public static mockBookingId;
	public static getBookingPromise = Promise.resolve(BookingsServiceMock.mockGetBooking);

	public async getBooking(bookingId: string): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return BookingsServiceMock.getBookingPromise;
	}

	public async getBookings(): Promise<Booking[]> {
		return Promise.resolve(BookingsServiceMock.mockBookings);
	}

	public async acceptBooking(bookingId: string): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return BookingsServiceMock.mockAcceptBooking;
	}

	public async searchBookings(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return Promise.resolve(BookingsServiceMock.mockSearchBookings);
	}

	public async save(bookingRequest: BookingRequest): Promise<Booking> {
		return BookingsServiceMock.mockPostBooking;
	}
}
