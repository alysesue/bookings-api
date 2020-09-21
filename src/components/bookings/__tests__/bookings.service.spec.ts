import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { BookingsService } from '../index';
import { BookingsRepository } from '../bookings.repository';
import { CalendarsService } from '../../calendars/calendars.service';
import { Container } from 'typescript-ioc';
import { Booking, BookingStatus, Calendar, ChangeLogAction, Service, ServiceProvider, User } from '../../../models';
import { InsertResult } from 'typeorm';
import { BookingAcceptRequest, BookingRequest, BookingSearchRequest } from '../bookings.apicontract';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { AvailableTimeslotProviders } from '../../timeslots/availableTimeslotProviders';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { UnavailabilitiesService } from '../../unavailabilities/unavailabilities.service';
import { UserContext } from '../../../infrastructure/userContext.middleware';
import { BookingBuilder } from '../../../models/entities/booking';
import { BookingsValidatorFactory, IValidator } from '../validator/bookings.validation';
import {
	BookingActionFunction,
	BookingChangeLogsService,
	GetBookingFunction,
} from '../../bookingChangeLogs/bookingChangeLogs.service';
import { ServicesService } from '../../services/services.service';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

function getBookingRequest() {
	const start = new Date('2020-02-01T11:00');
	const end = new Date('2020-02-01T12:00');
	return {
		refId: 'ref1',
		startDateTime: start,
		endDateTime: end,
		citizenEmail: 'test@mail.com',
		citizenName: 'Jake',
		citizenUinFin: 'S6979208A',
	} as BookingRequest;
}

// tslint:disable-next-line: no-big-function
describe('Bookings.Service', () => {
	const service = new Service();
	service.id = 1;
	const calendar = new Calendar();
	calendar.id = 1;
	calendar.uuid = '123';
	calendar.googleCalendarId = 'google-id-1';
	const serviceProvider = ServiceProvider.create('provider', calendar, 1);
	serviceProvider.id = 1;
	const bookingMock = new BookingBuilder()
		.withServiceId(1)
		.withStartDateTime(new Date('2020-10-01T01:00:00'))
		.withEndDateTime(new Date('2020-10-01T02:00:00'))
		.withRefId('REFID')
		.build();

	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});
	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

	class BookingValidatorFactoryMock extends BookingsValidatorFactory {
		public static validate = jest.fn();

		public getValidator(outOfSlotBooking: boolean): IValidator {
			return new (class implements IValidator {
				public async validate(booking: Booking) {
					return Promise.resolve(BookingValidatorFactoryMock.validate(booking));
				}
			})();
		}
	}

	let snapshot;

	beforeAll(() => {
		snapshot = Container.snapshot();
		Container.bind(BookingsRepository).to(BookingRepositoryMock);
		Container.bind(CalendarsService).to(CalendarsServiceMock);
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		Container.bind(UnavailabilitiesService).to(UnavailabilitiesServiceMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(BookingsValidatorFactory).to(BookingValidatorFactoryMock);
		Container.bind(BookingChangeLogsService).to(BookingChangeLogsServiceMock);
		Container.bind(ServicesService).to(ServicesServiceMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		BookingChangeLogsServiceMock.executeAndLogAction.mockImplementation(
			async (
				bookingId: number,
				getBookingFunction: GetBookingFunction,
				actionFunction: BookingActionFunction,
			) => {
				const _booking = await getBookingFunction(bookingId);
				const [action, newBooking] = await actionFunction(_booking);
				BookingChangeLogsServiceMock.action = action;
				return newBooking;
			},
		);

		ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(service));
		BookingChangeLogsServiceMock.action = 0;
	});

	afterAll(() => {
		snapshot.restore();
	});

	it('should save booking from booking request', async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.PendingApproval);
	});

	it('should save direct booking', async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 5;
		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.Accepted);
	});

	it('should allow booking out of timeslots', async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 5;
		bookingRequest.outOfSlotBooking = true;
		bookingRequest.refId = 'RFM186';
		bookingRequest.citizenUinFin = 'NRIC1234';
		BookingRepositoryMock.searchBookingsMock = [];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		TimeslotsServiceMock.acceptedBookings = [bookingMock];
		UnavailabilitiesServiceMock.isUnavailable.mockReturnValue(false);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.Accepted);
	});

	it('should not allow booking out of timeslots', async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.outOfSlotBooking = false;
		bookingRequest.citizenUinFin = 'NRIC1234';
		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		UnavailabilitiesServiceMock.isUnavailable.mockReturnValue(false);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
	});

	it('should accept booking', async () => {
		const bookingService = Container.get(BookingsService);
		CalendarsServiceMock.eventId = 'event-id';
		BookingRepositoryMock.booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		const acceptRequest = new BookingAcceptRequest();
		acceptRequest.serviceProviderId = 1;
		const result = await bookingService.acceptBooking(1, acceptRequest);

		expect(result.status).toBe(BookingStatus.Accepted);
		expect(result.eventICalId).toBe('event-id');
	});

	it('should cancel booking', async () => {
		const bookingService = Container.get(BookingsService);
		BookingRepositoryMock.booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		const result = await bookingService.cancelBooking(1);

		expect(result.status).toBe(BookingStatus.Cancelled);
	});

	it('should throw exception if booking not found', async () => {
		const bookingService = Container.get(BookingsService);
		BookingRepositoryMock.booking = undefined;
		await expect(async () => await bookingService.getBooking(1)).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Booking 1 not found'),
		);
	});

	it('should update booking', async () => {
		const bookingService = Container.get(BookingsService);

		const start = new Date('2020-02-02T11:00');
		const end = new Date('2020-02-02T12:00');
		const bookingRequest = {
			refId: 'ref1',
			startDateTime: start,
			endDateTime: end,
			citizenEmail: 'test@mail.com',
			citizenName: 'Jake',
			citizenUinFin: 'S6979208A',
		} as BookingRequest;

		BookingRepositoryMock.booking = new BookingBuilder()
			.withCitizenEmail('test@mail.com')
			.withStartDateTime(start)
			.withEndDateTime(end)
			.build();

		const booking = await bookingService.update(1, bookingRequest, 2);

		expect(booking.refId).toBe('ref1');
		expect(booking.citizenEmail).toBe('test@mail.com');
		expect(booking.citizenName).toBe('Jake');
		expect(booking.citizenUinFin).toBe('S6979208A');
	});

	it('should call log with reschedule action', async () => {
		const bookingService = Container.get(BookingsService);
		const bookingRequest = getBookingRequest();

		BookingRepositoryMock.booking = new BookingBuilder()
			.withCitizenEmail('test@mail.com')
			.withStartDateTime(new Date('2020-09-01'))
			.withEndDateTime(new Date('2020-09-02'))
			.build();

		await bookingService.update(1, bookingRequest, 2);

		expect(BookingChangeLogsServiceMock.action).toStrictEqual(ChangeLogAction.Reschedule);
	});

	it('should call log with update action', async () => {
		const bookingService = Container.get(BookingsService);
		const bookingRequest = getBookingRequest();

		BookingRepositoryMock.booking = new BookingBuilder()
			.withCitizenEmail('test@mail.com')
			.withStartDateTime(bookingRequest.startDateTime)
			.withEndDateTime(bookingRequest.endDateTime)
			.build();

		await bookingService.update(1, bookingRequest, 2);

		expect(BookingChangeLogsServiceMock.action).toStrictEqual(ChangeLogAction.Update);
	});

	it('should reject booking', async () => {
		const bookingService = Container.get(BookingsService);
		BookingRepositoryMock.booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		const result = await bookingService.rejectBooking(1);

		expect(result.status).toBe(BookingStatus.Rejected);
	});
});

export class BookingRepositoryMock extends BookingsRepository {
	public static booking: Booking;
	public static getBookingsMock: Booking[];
	public static searchBookingsMock: Booking[];
	public static saveMock: Promise<InsertResult>;

	public async getBooking(id: number): Promise<Booking> {
		return Promise.resolve(BookingRepositoryMock.booking);
	}

	public async insert(booking: Booking): Promise<InsertResult> {
		if (BookingRepositoryMock.saveMock) {
			return BookingRepositoryMock.saveMock;
		}
		BookingRepositoryMock.booking = booking;
		return Promise.resolve(new InsertResult());
	}

	public async update(booking: Booking): Promise<Booking> {
		return Promise.resolve(booking);
	}

	public async search(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return Promise.resolve(BookingRepositoryMock.searchBookingsMock);
	}
}

export class CalendarsServiceMock extends CalendarsService {
	public static eventId: string;

	public async createCalendarEvent(booking: Booking, calendar: Calendar): Promise<string> {
		return Promise.resolve(CalendarsServiceMock.eventId);
	}
}

export class TimeslotsServiceMock extends TimeslotsService {
	public static availableProvidersForTimeslot: ServiceProvider[] = [];
	public static acceptedBookings: Booking[] = [];

	public async getAvailableProvidersForTimeslot(
		startDateTime: Date,
		endDateTime: Date,
		serviceId: number,
	): Promise<AvailableTimeslotProviders> {
		const timeslotEntry = new AvailableTimeslotProviders();
		timeslotEntry.startTime = startDateTime;
		timeslotEntry.endTime = startDateTime;
		timeslotEntry.setRelatedServiceProviders(TimeslotsServiceMock.availableProvidersForTimeslot);

		return timeslotEntry;
	}
}

export class ServiceProvidersRepositoryMock extends ServiceProvidersRepository {
	public static getServiceProviderMock: ServiceProvider;

	public async getServiceProvider(): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProviderMock);
	}
}

export class UnavailabilitiesServiceMock extends UnavailabilitiesService {
	public static isUnavailable = jest.fn();

	public async isUnavailable(...params): Promise<any> {
		return await UnavailabilitiesServiceMock.isUnavailable(...params);
	}
}

export class UserContextMock extends UserContext {
	public static getCurrentUser = jest.fn();

	public init() { }

	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(params);
	}
}

class BookingChangeLogsServiceMock extends BookingChangeLogsService {
	public static executeAndLogAction = jest.fn();
	public static action: ChangeLogAction;

	public async executeAndLogAction(...params): Promise<any> {
		return await BookingChangeLogsServiceMock.executeAndLogAction(...params);
	}
}

class ServicesServiceMock extends ServicesService {
	public static getService = jest.fn();

	public init() { }

	public async getService(...params): Promise<any> {
		return await ServicesServiceMock.getService(params);
	}
}
