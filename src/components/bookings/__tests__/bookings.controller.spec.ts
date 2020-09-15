import { Container } from 'typescript-ioc';
import { Booking, BookingStatus } from '../../../models';
import { BookingsController } from '../bookings.controller';
import { BookingsService } from '../bookings.service';
import { BookingAcceptRequest, BookingRequest, BookingResponse, BookingSearchRequest } from '../bookings.apicontract';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { AvailableTimeslotProviders } from '../../timeslots/availableTimeslotProviders';
import { getRequestHeaders } from '../../../infrastructure/requestHelper';
import { MOLSecurityHeaderKeys } from 'mol-lib-api-contract/auth/common/mol-security-headers';
import { MOLAuthType } from 'mol-lib-api-contract/auth/common/MOLAuthType';
import { BookingBuilder } from '../../../models/entities/booking';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

jest.mock('../../../infrastructure/requestHelper', () => ({
	getRequestHeaders: jest.fn(),
}));

jest.mock('mol-lib-common', () => {
	const actual = jest.requireActual('mol-lib-common');
	const mock = (config: any) => {
		return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => descriptor;
	};
	return {
		...actual,
		MOLAuth: mock,
	};
});

describe('Bookings.Controller', () => {
	const testBooking1 = new BookingBuilder()
		.withServiceId(1)
		.withStartDateTime(new Date('2020-10-01T01:00:00'))
		.withEndDateTime(new Date('2020-10-01T02:00:00'))
		.build();

	const testBooking2 = new BookingBuilder()
		.withServiceId(1)
		.withStartDateTime(new Date('2020-10-01T15:00:00Z'))
		.withEndDateTime(new Date('2020-10-02T16:00:00Z'))
		.build();

	beforeAll(() => {
		Container.bind(BookingsService).to(BookingsServiceMock);
		Container.bind(TimeslotsService).to(jest.fn(() => TimeslotsServiceMock));
	});

	it('should accept booking', async () => {
		const controller = Container.get(BookingsController);
		const bookingId = 1;
		BookingsServiceMock.mockAcceptBooking = Promise.resolve(testBooking1);
		const request = new BookingAcceptRequest();
		await controller.acceptBooking(bookingId, request);

		expect(BookingsServiceMock.mockBookingId).toBe(bookingId);
	});

	it('should cancel booking', async () => {
		const controller = Container.get(BookingsController);
		const bookingId = 1;
		BookingsServiceMock.mockCancelBooking = Promise.resolve(testBooking1);

		await controller.cancelBooking(bookingId);

		expect(BookingsServiceMock.mockBookingId).toBe(bookingId);
	});

	it('should update booking', async () => {
		const controller = Container.get(BookingsController);
		const bookingId = 1;
		BookingsServiceMock.mockCancelBooking = Promise.resolve(testBooking1);
		BookingsServiceMock.mockPostBooking = Promise.resolve(testBooking2);

		const res = await controller.updateBooking(bookingId, new BookingRequest(), 1);

		expect(BookingsServiceMock.mockBookingId).toBe(bookingId);
		expect((res as Booking).startDateTime.toISOString()).toEqual('2020-10-01T15:00:00.000Z');
	});

	it('should search bookings', async () => {
		BookingsServiceMock.mockSearchBookings = [testBooking1];
		const from = new Date('2020-05-16T20:25:43.511Z');
		const to = new Date('2020-05-16T21:25:43.511Z');
		const citizenUinFins = ['abc123', 'xyz456'];
		const controller = Container.get(BookingsController);

		const result = await controller.getBookings(from, to, [1], citizenUinFins, 1);

		expect(result).toHaveLength(1);
	});

	it('should return one booking', async () => {
		const controller = Container.get(BookingsController);
		const startTime = new Date('2020-10-01T01:00:00');
		const endTime = new Date('2020-10-01T02:00:00');

		BookingsServiceMock.getBookingPromise = Promise.resolve(
			new BookingBuilder().withServiceId(1).withStartDateTime(startTime).withEndDateTime(endTime).build(),
		);

		const result = await controller.getBooking(1);

		expect(result.startDateTime).toBe(startTime);
		expect(result.endDateTime).toBe(endTime);
		expect(result.status).toBe(BookingStatus.PendingApproval);
	});

	it('should get booking providers', async () => {
		const controller = Container.get(BookingsController);
		BookingsServiceMock.mockGetBooking = testBooking1;

		const result = await controller.getBookingProviders(1);

		expect(result).toBeDefined();
		expect(TimeslotsServiceMock.getAvailableProvidersForTimeslot).toBeCalled();
	});

	it('should post booking', async () => {
		BookingsServiceMock.mockPostBooking = Promise.resolve(testBooking1);
		const controller = Container.get(BookingsController);
		const headers = {
			[MOLSecurityHeaderKeys.USER_UINFIN]: MOLAuthType.USER,
			[MOLSecurityHeaderKeys.USER_ID]: 'abc',
		};

		(controller as any).context = { headers };
		(getRequestHeaders as jest.Mock).mockReturnValue({ get: () => headers });

		const result = await controller.postBooking(new BookingRequest(), 1);

		expect(result as BookingResponse);
	});

	it('should post out of timeslot booking', async () => {
		BookingsServiceMock.mockPostBooking = Promise.resolve(testBooking1);
		const controller = Container.get(BookingsController);

		const result = await controller.postBookingOutOfSlot(new BookingRequest(), 1);

		expect(result as BookingResponse);
	});

	it('should reject booking', async () => {
		const controller = Container.get(BookingsController);
		const bookingId = 1;
		BookingsServiceMock.mockRejectBooking = Promise.resolve(testBooking1);

		await controller.rejectBooking(bookingId);

		expect(BookingsServiceMock.mockBookingId).toBe(bookingId);
	});
});

const TimeslotsServiceMock = {
	getAvailableProvidersForTimeslot: jest.fn(() =>
		Promise.resolve(AvailableTimeslotProviders.empty(new Date(), new Date())),
	),
};

class BookingsServiceMock extends BookingsService {
	public static mockBooking: Booking;
	public static mockAcceptBooking = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockCancelBooking = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockRejectBooking = Promise.resolve(BookingsServiceMock.mockBooking);
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
	public async rejectBooking(bookingId: number): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return BookingsServiceMock.mockRejectBooking;
	}

	public async searchBookings(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return Promise.resolve(BookingsServiceMock.mockSearchBookings);
	}

	public async save(bookingRequest: BookingRequest): Promise<Booking> {
		return BookingsServiceMock.mockPostBooking;
	}
}
