import { Container } from "typescript-ioc";
import { Booking, BookingStatus, Calendar } from "../../models";
import { BookingsController } from "../bookings.controller";
import { BookingsService } from "../bookings.service";
import { BookingAcceptRequest, BookingRequest, BookingResponse, BookingSearchRequest } from "../bookings.apicontract";
import { AvailableTimeslotProviders, TimeslotsService } from '../../timeslots/timeslots.service';

describe("Bookings.Controller", () => {
	beforeAll(() => {
		Container.bind(BookingsService).to(BookingsServiceMock);
		Container.bind(TimeslotsService).to(jest.fn(() => TimeslotsServiceMock));
	});

	it('should accept booking', async () => {
		const controller = Container.get(BookingsController);
		const bookingId = 'booking-1';
		BookingsServiceMock.mockAcceptBooking = Promise.resolve(Booking.create(1, new Date(), 120));
		const request = new BookingAcceptRequest();
		await controller.acceptBooking(bookingId, request);

		expect(BookingsServiceMock.mockBookingId).toBe(bookingId);
	});

	it('should search bookings', async () => {
		BookingsServiceMock.mockSearchBookings = [Booking.create(1, new Date(), 120)];
		const from = new Date('2020-05-16T20:25:43.511Z');
		const to = new Date('2020-05-16T21:25:43.511Z');
		const controller = Container.get(BookingsController);

		const result = await controller.getBookings(from, to, 1, 1);

		expect(result).toHaveLength(1);
	});

	it('should return one booking', async () => {
		const controller = Container.get(BookingsController);
		const testTime = new Date('2020-05-16T20:25:43.511Z');

		BookingsServiceMock.getBookingPromise = Promise.resolve(Booking.create(1, testTime, 120));

		const result = await controller.getBooking("booking-id-1");

		expect(result.startDateTime).toBe(testTime);
		expect(result.status).toBe(BookingStatus.PendingApproval);
	});

	it('should get booking providers', async () => {
		const controller = Container.get(BookingsController);
		const testTime = new Date('2020-05-16T20:25:43.511Z');

		BookingsServiceMock.mockGetBooking = Booking.create(1, testTime, 120);

		const result = await controller.getBookingProviders("booking-id-1");

		expect(result).toBeDefined();
		expect(TimeslotsServiceMock.getAvailableProvidersForTimeslot).toBeCalled();
	});

	it('should post booking', async () => {
		BookingsServiceMock.mockPostBooking = Promise.resolve(Booking.create(1, new Date(), 60));
		const controller = Container.get(BookingsController);

		const result = await controller.postBooking(new BookingRequest(), 1);

		expect(result as BookingResponse);
	});
});

const TimeslotsServiceMock = {
	getAvailableProvidersForTimeslot: jest.fn(() => Promise.resolve(AvailableTimeslotProviders.empty(new Date(), new Date())))
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
