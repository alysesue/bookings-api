import { Container } from 'typescript-ioc';
import * as Koa from 'koa';
import { Booking, BookingChangeLog, BookingStatus, User } from '../../../models';
import { BookingsController } from '../bookings.controller';
import { BookingsService } from '../bookings.service';
import { BookingAcceptRequest, BookingRequest, BookingResponse, BookingUpdateRequest } from '../bookings.apicontract';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { MOLSecurityHeaderKeys } from 'mol-lib-api-contract/auth/common/mol-security-headers';
import { MOLAuthType } from 'mol-lib-api-contract/auth/common/MOLAuthType';
import { BookingBuilder } from '../../../models/entities/booking';
import { TimeslotServiceProviderResult } from '../../../models/timeslotServiceProvider';
import { CaptchaService } from '../../captcha/captcha.service';
import { KoaContextStore } from '../../../infrastructure/koaContextStore.middleware';
import { IPagedEntities } from '../../../core/pagedEntities';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { ContainerContext } from '../../../infrastructure/containerContext.middleware';
import { UserContext } from '../../../infrastructure/auth/userContext';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

jest.mock('mol-lib-common', () => {
	const actual = jest.requireActual('mol-lib-common');
	const mock = () => {
		return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => descriptor;
	};
	return {
		...actual,
		MOLAuth: mock,
	};
});

// tslint:disable-next-line: no-big-function
describe('Bookings.Controller', () => {
	const KoaContextStoreMock: Partial<KoaContextStore> = {
		koaContext: {
			header: {
				set: jest.fn(),
				get: jest.fn(),
			} as Partial<Headers>,
		} as Koa.Context,
	};

	const testBooking1 = new BookingBuilder()
		.withServiceId(1)
		.withStartDateTime(new Date('2020-10-01T01:00:00Z'))
		.withEndDateTime(new Date('2020-10-01T02:00:00Z'))
		.build();
	testBooking1.id = 10;
	testBooking1.createdLog = new BookingChangeLog();
	testBooking1.createdLog.timestamp = new Date('2020-01-01T01:01:01Z');

	const testBooking2 = new BookingBuilder()
		.withServiceId(1)
		.withStartDateTime(new Date('2020-10-01T15:00:00Z'))
		.withEndDateTime(new Date('2020-10-02T16:00:00Z'))
		.build();

	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	beforeAll(() => {
		Container.bind(BookingsService).to(BookingsServiceMock);
		Container.bind(TimeslotsService).to(jest.fn(() => TimeslotsServiceMock));
		Container.bind(CaptchaService).to(CaptchaServiceMock);
		Container.bind(KoaContextStore).factory(() => KoaContextStoreMock);
		Container.bind(UserContext).to(UserContextMock);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		KoaContextStoreMock.koaContext.header = { origin: 'local.booking.gov.sg' };
		Container.bind(ContainerContext).factory(() => ContainerContext);
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
		BookingsServiceMock.mockUpdateBooking = testBooking2;

		const res = await controller.updateBooking(bookingId, new BookingUpdateRequest(), 1);

		expect(BookingsServiceMock.mockBookingId).toBe(bookingId);
		expect(res.data.startDateTime.toISOString()).toEqual('2020-10-01T15:00:00.000Z');
	});

	it('should search bookings (default paging)', async () => {
		BookingsServiceMock.searchBookings.mockImplementation(() =>
			Promise.resolve({
				entries: [testBooking1],
			} as IPagedEntities<Booking>),
		);

		const from = new Date('2020-05-16T20:25:43.511Z');
		const to = new Date('2020-05-16T21:25:43.511Z');
		const fromCreatedDate = new Date('2020-05-10T20:25:43.511Z');
		const toCreatedDate = new Date('2020-05-20T21:25:43.511Z');
		const citizenUinFins = ['abc123', 'xyz456'];
		const controller = Container.get(BookingsController);

		const result = await controller.getBookings(
			from,
			to,
			fromCreatedDate,
			toCreatedDate,
			[1],
			citizenUinFins,
			undefined,
			undefined,
			undefined,
			undefined,
			1,
		);

		expect(BookingsServiceMock.searchBookings).toHaveBeenCalledWith({
			from: new Date('2020-05-16T20:25:43.511Z'),
			to: new Date('2020-05-16T21:25:43.511Z'),
			fromCreatedDate: new Date('2020-05-10T20:25:43.511Z'),
			toCreatedDate: new Date('2020-05-20T21:25:43.511Z'),
			statuses: [1],
			citizenUinFins: ['abc123', 'xyz456'],
			serviceId: 1,
			page: 1,
			limit: 100,
		});

		expect(result.data.length).toBe(1);
		expect(result.data[0]).toEqual({
			id: 10,
			createdDateTime: new Date('2020-01-01T01:01:01.000Z'),
			endDateTime: new Date('2020-10-01T02:00:00.000Z'),
			serviceId: 1,
			startDateTime: new Date('2020-10-01T01:00:00.000Z'),
			status: 1,
		} as BookingResponse);
	});

	it('should search bookings (explicit paging)', async () => {
		BookingsServiceMock.searchBookings.mockImplementation(() =>
			Promise.resolve({
				entries: [testBooking1],
			} as IPagedEntities<Booking>),
		);

		const from = new Date('2020-05-16T20:25:43.511Z');
		const to = new Date('2020-05-16T21:25:43.511Z');
		const fromCreatedDate = new Date('2020-05-10T20:25:43.511Z');
		const toCreatedDate = new Date('2020-05-20T21:25:43.511Z');
		const citizenUinFins = ['abc123', 'xyz456'];
		const controller = Container.get(BookingsController);

		const result = await controller.getBookings(
			from,
			to,
			fromCreatedDate,
			toCreatedDate,
			[1],
			citizenUinFins,
			[55],
			2,
			50,
			123,
			1,
		);

		expect(BookingsServiceMock.searchBookings).toHaveBeenCalledWith({
			from: new Date('2020-05-16T20:25:43.511Z'),
			to: new Date('2020-05-16T21:25:43.511Z'),
			fromCreatedDate: new Date('2020-05-10T20:25:43.511Z'),
			toCreatedDate: new Date('2020-05-20T21:25:43.511Z'),
			statuses: [1],
			citizenUinFins: ['abc123', 'xyz456'],
			serviceId: 1,
			serviceProviderIds: [55],
			page: 2,
			limit: 50,
			maxId: 123,
		});

		expect(result.data.length).toBe(1);
		expect(result.data[0]).toEqual({
			id: 10,
			createdDateTime: new Date('2020-01-01T01:01:01.000Z'),
			endDateTime: new Date('2020-10-01T02:00:00.000Z'),
			serviceId: 1,
			startDateTime: new Date('2020-10-01T01:00:00.000Z'),
			status: 1,
		} as BookingResponse);
	});

	it('should return one booking', async () => {
		const controller = Container.get(BookingsController);
		const startTime = new Date('2020-10-01T01:00:00');
		const endTime = new Date('2020-10-01T02:00:00');

		BookingsServiceMock.getBookingPromise = Promise.resolve(
			new BookingBuilder().withServiceId(1).withStartDateTime(startTime).withEndDateTime(endTime).build(),
		);

		const result = await controller.getBooking(1);

		expect(result.data.startDateTime).toBe(startTime);
		expect(result.data.endDateTime).toBe(endTime);
		expect(result.data.status).toBe(BookingStatus.PendingApproval);
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
		CaptchaServiceMock.verify.mockReturnValue(Promise.resolve(true));
		const controller = Container.get(BookingsController);
		const headers = {
			[MOLSecurityHeaderKeys.USER_UINFIN]: MOLAuthType.USER,
			[MOLSecurityHeaderKeys.USER_ID]: 'abc',
		};

		(controller as any).context = { headers };
		const req = new BookingRequest();
		req.captchaToken = '123';
		const result = await controller.postBooking(req, 1);

		expect(result).toBeDefined();
		expect(req.captchaOrigin).toBe('local.booking.gov.sg');
	});

	it('should post out of timeslot booking', async () => {
		BookingsServiceMock.mockPostBooking = Promise.resolve(testBooking1);
		const controller = Container.get(BookingsController);

		const result = await controller.postBookingOutOfSlot(new BookingRequest(), 1);

		expect(result).toBeDefined();
	});

	it('should reject booking', async () => {
		const controller = Container.get(BookingsController);
		const bookingId = 1;
		BookingsServiceMock.mockRejectBooking = Promise.resolve(testBooking1);

		await controller.rejectBooking(bookingId);

		expect(BookingsServiceMock.mockBookingId).toBe(bookingId);
	});

	it('should validate on hold booking', async () => {
		const controller = Container.get(BookingsController);
		const bookingId = 1;
		BookingsServiceMock.mockValidateOnHoldBooking = Promise.resolve(testBooking1);
		const request = new BookingRequest();
		const result = await controller.validateOnHoldBooking(request, bookingId);

		expect(result.data.startDateTime.toISOString()).toBe('2020-10-01T01:00:00.000Z');
		expect(result.data.endDateTime.toISOString()).toBe('2020-10-01T02:00:00.000Z');
		expect(result.data.serviceId).toBe(1);
		expect(result.data.status).toBe(1);
		expect(BookingsServiceMock.mockBookingId).toBe(bookingId);
	});
});

const TimeslotsServiceMock = {
	getAvailableProvidersForTimeslot: jest.fn<Promise<TimeslotServiceProviderResult[]>, any>(() => Promise.resolve([])),
};

class BookingsServiceMock implements Partial<BookingsService> {
	public static mockBooking: Booking;
	public static mockAcceptBooking = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockCancelBooking = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockRejectBooking = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockGetBooking: Booking;
	public static mockPostBooking = Promise.resolve(BookingsServiceMock.mockBooking);
	public static mockBookings: Booking[] = [];
	public static searchBookings = jest.fn<Promise<IPagedEntities<Booking>>, any>();
	public static mockBookingId;
	public static getBookingPromise = Promise.resolve(BookingsServiceMock.mockGetBooking);
	public static mockUpdateBooking: Booking;
	public static mockValidateOnHoldBooking = Promise.resolve(BookingsServiceMock.mockBooking);

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

	public async searchBookings(...params): Promise<any> {
		return await BookingsServiceMock.searchBookings(...params);
	}

	public async save(bookingRequest: BookingRequest): Promise<Booking> {
		return BookingsServiceMock.mockPostBooking;
	}

	public async update(bookingId: number, bookingRequest: BookingRequest, serviceId: number): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return BookingsServiceMock.mockUpdateBooking;
	}

	public async validateOnHoldBooking(bookingId: number, bookingRequest: BookingRequest): Promise<Booking> {
		BookingsServiceMock.mockBookingId = bookingId;
		return BookingsServiceMock.mockValidateOnHoldBooking;
	}
}

export class CaptchaServiceMock implements Partial<CaptchaService> {
	public static verify = jest.fn<Promise<boolean>, any>();

	public async verify(...params): Promise<any> {
		return await CaptchaServiceMock.verify(...params);
	}
}
