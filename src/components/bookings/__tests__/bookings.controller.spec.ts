import { Container } from "typescript-ioc";
import { Booking, BookingStatus } from "../../../models";
import { BookingsController } from "../bookings.controller";
import { BookingsService } from "../bookings.service";
import { BookingAcceptRequest, BookingRequest, BookingResponse, BookingSearchRequest } from "../bookings.apicontract";
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { AvailableTimeslotProviders } from '../../timeslots/availableTimeslotProviders';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

jest.mock("mol-lib-common", () => {
	const actual = jest.requireActual('mol-lib-common');
	const mock = (config: any) => {
		return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => descriptor;
	};
	return {
		...actual,
		MOLAuth: mock
	};
});

describe("Bookings.Controller", () => {
	beforeAll(() => {
		Container.bind(BookingsService).to(BookingsServiceMock);
		Container.bind(TimeslotsService).to(jest.fn(() => TimeslotsServiceMock));
	});

	it('should accept booking', async () => {
		const controller = Container.get(BookingsController);
		const bookingId = 1;
		BookingsServiceMock.mockAcceptBooking = Promise.resolve(Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00')));
		const request = new BookingAcceptRequest();
		await controller.acceptBooking(bookingId, request);

		expect(BookingsServiceMock.mockBookingId).toBe(bookingId);
	});

	it('should cancel booking', async () => {
		const controller = Container.get(BookingsController);
		const bookingId = 1;
		BookingsServiceMock.mockCancelBooking = Promise.resolve(Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00')));

		await controller.cancelBooking(bookingId);

		expect(BookingsServiceMock.mockBookingId).toBe(bookingId);
	});

	it('should update booking', async () => {
		const controller = Container.get(BookingsController);
		const bookingId = 1;
		BookingsServiceMock.mockCancelBooking = Promise.resolve(Booking.create(1, new Date('2020-09-01T01:00:00'), new Date('2020-09-02T02:00:00')));
		BookingsServiceMock.mockPostBooking = Promise.resolve(Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-02T02:00:00')));

		const res = await controller.updateBooking(bookingId, new BookingRequest(), 1);

		expect(BookingsServiceMock.mockBookingId).toBe(bookingId);
		expect((res as Booking).startDateTime).toEqual('2020-10-01T01:00:00');
	});

	it('should search bookings', async () => {
		BookingsServiceMock.mockSearchBookings = [Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'))];
		const from = new Date('2020-05-16T20:25:43.511Z');
		const to = new Date('2020-05-16T21:25:43.511Z');
		const controller = Container.get(BookingsController);

		const result = await controller.getBookings(from, to, [1], 1);

		expect(result).toHaveLength(1);
	});

	it('should return one booking', async () => {
		const controller = Container.get(BookingsController);
		const startTime = new Date('2020-10-01T01:00:00');
		const endTime = new Date('2020-10-01T02:00:00');

		BookingsServiceMock.getBookingPromise = Promise.resolve(Booking.create(1, startTime, endTime));

		const result = await controller.getBooking(1);

		expect(result.startDateTime).toBe(startTime);
		expect(result.endDateTime).toBe(endTime);
		expect(result.status).toBe(BookingStatus.PendingApproval);
	});

	it('should get booking providers', async () => {
		const controller = Container.get(BookingsController);

		BookingsServiceMock.mockGetBooking = Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'));

		const result = await controller.getBookingProviders(1);

		expect(result).toBeDefined();
		expect(TimeslotsServiceMock.getAvailableProvidersForTimeslot).toBeCalled();
	});

	it('should post booking', async () => {
		BookingsServiceMock.mockPostBooking = Promise.resolve(Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00')));
		const controller = Container.get(BookingsController);

		const result = await controller.postBooking(new BookingRequest(), 1);

		expect(result as BookingResponse);
	});

	it('should post out of timeslot booking', async () => {
		BookingsServiceMock.mockPostBooking = Promise.resolve(Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00')));
		const controller = Container.get(BookingsController);

		const result = await controller.postBookingOutOfSlot(new BookingRequest(), 1);

		expect(result as BookingResponse);
	});
});

const TimeslotsServiceMock = {
	getAvailableProvidersForTimeslot: jest.fn(() => Promise.resolve(AvailableTimeslotProviders.empty(new Date(), new Date())))
};

class BookingsServiceMock extends BookingsService {
	public static mockBooking: Booking;
	public static mockAcceptBooking = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockCancelBooking = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockGetBooking: Booking;
	public static mockPostBooking = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockBookings: Booking[] = [];
	public static mockSearchBookings: Booking[] = [];
	public static mockBookingId;
	public static getBookingPromise = Promise.resolve(BookingsServiceMock.mockGetBooking);

	public async getBooking(bookingId: number): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return BookingsServiceMock.getBookingPromise;
	}

	public async acceptBooking(bookingId: number): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return BookingsServiceMock.mockAcceptBooking;
	}

	public async cancelBooking(bookingId: number): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return BookingsServiceMock.mockCancelBooking;
	}

	public async searchBookings(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return Promise.resolve(BookingsServiceMock.mockSearchBookings);
	}

	public async save(bookingRequest: BookingRequest): Promise<Booking> {
		return BookingsServiceMock.mockPostBooking;
	}
}
