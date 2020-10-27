import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { BookingsService } from '../index';
import { BookingsRepository } from '../bookings.repository';
import { CalendarsService } from '../../calendars/calendars.service';
import { Container } from 'typescript-ioc';
import {
	Booking,
	BookingStatus,
	Calendar,
	ChangeLogAction,
	Service,
	ServiceProvider,
	TimeslotsSchedule,
	User,
} from '../../../models';
import { BookingAcceptRequest, BookingRequest } from '../bookings.apicontract';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { UnavailabilitiesService } from '../../unavailabilities/unavailabilities.service';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { BookingBuilder } from '../../../models/entities/booking';
import { BookingsValidatorFactory, IValidator } from '../validator/bookings.validation';
import {
	BookingActionFunction,
	BookingChangeLogsService,
	GetBookingFunction,
} from '../../bookingChangeLogs/bookingChangeLogs.service';
import { ServicesService } from '../../services/services.service';
import {
	CitizenAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import {
	BookingChangeLogsServiceMock,
	BookingRepositoryMock,
	CalendarsServiceMock,
	ServiceProvidersRepositoryMock,
	ServiceProvidersServiceMock,
	ServicesServiceMock,
	TimeslotsServiceMock,
	UnavailabilitiesServiceMock,
	UserContextMock,
} from './bookings.mocks';
import { ServiceProvidersService } from '../../../components/serviceProviders/serviceProviders.service';

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
	const serviceProvider = ServiceProvider.create('provider', 1);
	serviceProvider.id = 1;
	serviceProvider.calendar = calendar;

	const timeslotSchedule = new TimeslotsSchedule();
	timeslotSchedule._id = 1;
	timeslotSchedule._serviceProvider = serviceProvider;

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
		Container.bind(UnavailabilitiesService).to(UnavailabilitiesServiceMock);
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
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
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(singpassMock)]));

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.PendingApproval);
	});

	it('should auto accept booking for citizen (when sp flag = true)', async () => {
		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;
		customProvider.autoAcceptBookings = true;

		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;
		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [customProvider];
		ServiceProvidersServiceMock.getServiceProvider.mockReturnValue(Promise.resolve(customProvider));
		ServiceProvidersRepositoryMock.getServiceProviderMock = customProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(singpassMock)]));

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.Accepted);
	});

	it('should not auto accept booking for citizen (when sp flag = false)', async () => {
		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;
		customProvider.autoAcceptBookings = false;

		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;
		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [customProvider];
		ServiceProvidersServiceMock.getServiceProvider.mockReturnValue(Promise.resolve(customProvider));
		ServiceProvidersRepositoryMock.getServiceProviderMock = customProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(singpassMock)]));

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.PendingApproval);
	});

	it('should always auto accept booking for admins (even when sp flag = false)', async () => {
		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;
		customProvider.autoAcceptBookings = false;

		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;
		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [customProvider];
		ServiceProvidersServiceMock.getServiceProvider.mockReturnValue(Promise.resolve(customProvider));
		ServiceProvidersRepositoryMock.getServiceProviderMock = customProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceProviderAuthGroup(adminMock, customProvider)]),
		);

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.Accepted);
	});

	it('should save direct booking', async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 1;
		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		ServiceProvidersServiceMock.getServiceProvider.mockReturnValue(Promise.resolve(serviceProvider));
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(singpassMock)]));

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.Accepted);
	});

	it('should allow booking out of timeslots', async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 1;
		bookingRequest.outOfSlotBooking = true;
		bookingRequest.refId = 'RFM186';
		bookingRequest.citizenUinFin = 'NRIC1234';
		BookingRepositoryMock.searchBookingsMock = [];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		ServiceProvidersServiceMock.getServiceProvider.mockReturnValue(Promise.resolve(serviceProvider));
		TimeslotsServiceMock.acceptedBookings = [bookingMock];
		UnavailabilitiesServiceMock.isUnavailable.mockReturnValue(false);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceProviderAuthGroup(adminMock, serviceProvider)]),
		);

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
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

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

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		const acceptRequest = new BookingAcceptRequest();
		acceptRequest.serviceProviderId = 1;
		const result = await bookingService.acceptBooking(1, acceptRequest);

		expect(result.status).toBe(BookingStatus.Accepted);
		expect(result.eventICalId).toBe('event-id');
	});

	it('should accept booking with pre selected service provider', async () => {
		const bookingService = Container.get(BookingsService);
		CalendarsServiceMock.eventId = 'event-id';
		BookingRepositoryMock.booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		BookingRepositoryMock.booking.serviceProviderId = 1;

		TimeslotsServiceMock.availableProvidersForTimeslot = [];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		const acceptRequest = new BookingAcceptRequest();
		acceptRequest.serviceProviderId = 1;
		const result = await bookingService.acceptBooking(1, acceptRequest);

		expect(result.status).toBe(BookingStatus.Accepted);
		expect(result.eventICalId).toBe('event-id');
	});

	it('should cancel booking', async () => {
		const startDate = new Date();
		startDate.setDate(new Date().getDate() + 1);

		const endDate = new Date(startDate);
		endDate.setHours(endDate.getHours() + 1);

		BookingRepositoryMock.booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(startDate)
			.withEndDateTime(endDate)
			.build();
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		const bookingService = Container.get(BookingsService);
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
			.withServiceId(service.id)
			.withCitizenEmail('test@mail.com')
			.withStartDateTime(start)
			.withEndDateTime(end)
			.build();

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		const booking = await bookingService.update(1, bookingRequest, 2, true);

		expect(booking.refId).toBe('ref1');
		expect(booking.citizenEmail).toBe('test@mail.com');
		expect(booking.citizenName).toBe('Jake');
		expect(booking.citizenUinFin).toBe('S6979208A');
	});

	it('should call log with reschedule action', async () => {
		const bookingService = Container.get(BookingsService);
		const bookingRequest = getBookingRequest();

		BookingRepositoryMock.booking = new BookingBuilder()
			.withServiceId(service.id)
			.withCitizenEmail('test@mail.com')
			.withStartDateTime(new Date('2020-09-01'))
			.withEndDateTime(new Date('2020-09-02'))
			.build();

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		await bookingService.update(1, bookingRequest, 2, true);

		expect(BookingChangeLogsServiceMock.action).toStrictEqual(ChangeLogAction.Reschedule);
	});

	it('should call log with update action', async () => {
		const bookingService = Container.get(BookingsService);
		const bookingRequest = getBookingRequest();

		BookingRepositoryMock.booking = new BookingBuilder()
			.withServiceId(service.id)
			.withCitizenEmail('test@mail.com')
			.withStartDateTime(bookingRequest.startDateTime)
			.withEndDateTime(bookingRequest.endDateTime)
			.build();

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		await bookingService.update(1, bookingRequest, 2, true);

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

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		const result = await bookingService.rejectBooking(1);

		expect(result.status).toBe(BookingStatus.Rejected);
	});

	describe('Reschedule', () => {
		it('should reschedule booking', async () => {
			const bookingService = Container.get(BookingsService);
			BookingRepositoryMock.booking = new BookingBuilder()
				.withServiceId(service.id)
				.withStartDateTime(new Date('2020-10-01T01:00:00'))
				.withEndDateTime(new Date('2020-10-01T02:00:00'))
				.withServiceProviderId(1)
				.build();

			const rescheduleRequest = {
				startDateTime: new Date('2020-10-01T05:00:00'),
				endDateTime: new Date('2020-10-01T06:00:00'),
			} as BookingRequest;

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
			);

			const result = await bookingService.reschedule(1, rescheduleRequest, false);
			expect(BookingChangeLogsServiceMock.action).toStrictEqual(ChangeLogAction.Reschedule);
			expect(result.status).toStrictEqual(BookingStatus.PendingApproval);
		});

		it('should not reschedule rejected booking', async () => {
			const bookingService = Container.get(BookingsService);
			BookingRepositoryMock.booking = new BookingBuilder()
				.withServiceId(1)
				.withStartDateTime(new Date('2020-10-01T01:00:00'))
				.withEndDateTime(new Date('2020-10-01T02:00:00'))
				.withServiceProviderId(1)
				.build();

			BookingRepositoryMock.booking.status = BookingStatus.Rejected;

			const rescheduleRequest = {
				startDateTime: new Date('2020-10-01T05:00:00'),
				endDateTime: new Date('2020-10-01T06:00:00'),
			} as BookingRequest;

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
			);

			await expect(
				async () => await bookingService.reschedule(1, rescheduleRequest, false),
			).rejects.toThrowError();
		});
	});
});
