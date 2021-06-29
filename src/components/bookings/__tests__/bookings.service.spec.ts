import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { BookingsService } from '../index';
import { BookingsRepository } from '../bookings.repository';
import { Container } from 'typescript-ioc';
import {
	Booking,
	BookingStatus,
	ChangeLogAction,
	Service,
	ServiceProvider,
	TimeslotsSchedule,
	User,
} from '../../../models';
import {
	BookingAcceptRequest,
	BookingReject,
	BookingRequest,
	BookingSearchRequest,
	BookingUpdateRequest,
} from '../bookings.apicontract';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { UnavailabilitiesService } from '../../unavailabilities/unavailabilities.service';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { BookingBuilder } from '../../../models/entities/booking';
import { BookingsValidatorFactory, IBookingsValidator } from '../validator/bookings.validation';
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
	ServiceProvidersRepositoryMock,
	TimeslotsServiceMock,
	UnavailabilitiesServiceMock,
	UsersServiceMock,
} from '../__mocks__/bookings.mocks';
import { ServiceProvidersService } from '../../serviceProviders/serviceProviders.service';
import { TimeslotWithCapacity } from '../../../models/timeslotWithCapacity';
import { UsersService } from '../../users/users.service';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { ServicesServiceMock } from '../../services/__mocks__/services.service';
import { ceil } from 'lodash';
import { IPagedEntities } from '../../../core/pagedEntities';
import { getConfig } from '../../../config/app-config';
import { BookingsSubject } from '../bookings.subject';
import { BookingsSubjectMock } from '../__mocks__/bookings.subject.mock';
import { MailObserver } from '../../notifications/notification.observer';
import { MockObserver } from '../../../infrastructure/__mocks__/observer.mock';
import { ServiceProvidersServiceMock } from '../../serviceProviders/__mocks__/serviceProviders.service.mock';
import { randomIndex } from '../../../tools/arrays';

jest.mock('../../../tools/arrays');

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

function getUpdateBookingRequest() {
	const start = new Date('2020-02-01T11:00');
	const end = new Date('2020-02-01T12:00');
	return {
		refId: 'ref1',
		startDateTime: start,
		endDateTime: end,
		citizenEmail: 'test@mail.com',
		citizenName: 'Jake',
		citizenUinFin: 'S6979208A',
		citizenUinFinUpdated: true,
	} as BookingUpdateRequest;
}

const createTimeslot = (startTime: Date, endTime: Date, capacity?: number) => {
	return {
		startTimeNative: startTime.getTime(),
		endTimeNative: endTime.getTime(),
		capacity: capacity || 1,
	} as TimeslotWithCapacity;
};

// tslint:disable-next-line: no-big-function
describe('Bookings.Service', () => {
	const service = new Service();
	service.id = 1;
	const serviceProvider = ServiceProvider.create('provider', 1);
	serviceProvider.id = 1;

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

	const validatorMock = {
		bypassCaptcha: jest.fn(),
		validate: jest.fn(),
		addCustomCitizenValidations: jest.fn(),
	} as IBookingsValidator;

	const onHolValidatorMock = {
		bypassCaptcha: jest.fn(),
		validate: jest.fn(),
		addCustomCitizenValidations: jest.fn(),
	} as IBookingsValidator;

	class BookingValidatorFactoryMock implements Partial<BookingsValidatorFactory> {
		public getValidator(): IBookingsValidator {
			return validatorMock;
		}
		public getOnHoldValidator(): IBookingsValidator {
			return onHolValidatorMock;
		}
	}

	let snapshot;

	beforeAll(() => {
		snapshot = Container.snapshot();
		Container.bind(BookingsRepository).to(BookingRepositoryMock);
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(UnavailabilitiesService).to(UnavailabilitiesServiceMock);
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(BookingsValidatorFactory).to(BookingValidatorFactoryMock);
		Container.bind(BookingChangeLogsService).to(BookingChangeLogsServiceMock);
		Container.bind(ServicesService).to(ServicesServiceMock);
		Container.bind(UsersService).to(UsersServiceMock);
		Container.bind(BookingsSubject).to(BookingsSubjectMock);
		Container.bind(MailObserver).to(MockObserver);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		BookingChangeLogsServiceMock.executeAndLogAction.mockImplementation(
			async (
				bookingId: number,
				getBookingFunction: GetBookingFunction,
				actionFunction: BookingActionFunction,
			) => {
				const _booking = await getBookingFunction(bookingId, {});
				const [action, newBooking] = await actionFunction(_booking);
				BookingChangeLogsServiceMock.action = action;
				return newBooking;
			},
		);
		(getConfig as jest.Mock).mockReturnValue({
			isAutomatedTest: false,
			featureFlag: {
				lifeSGSync: 'true',
			},
		});
		ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(service));
		BookingChangeLogsServiceMock.action = 0;
		TimeslotsServiceMock.availableProvidersForTimeslot = new Map<ServiceProvider, TimeslotWithCapacity>();
		TimeslotsServiceMock.acceptedBookings = [];
		BookingRepositoryMock.searchBookings.mockImplementation(() =>
			Promise.resolve({ entries: [] } as IPagedEntities<Booking>),
		);
		BookingRepositoryMock.searchReturnAll.mockImplementation(() => Promise.resolve([]));

		UsersServiceMock.persistUserIfRequired.mockImplementation((u) => Promise.resolve(u));
	});

	afterAll(() => {
		snapshot.restore();
	});

	it('should search bookings', async () => {
		const searchRequest: BookingSearchRequest = {
			from: new Date('2020-05-16T20:25:43.511Z'),
			to: new Date('2020-05-16T21:25:43.511Z'),
			fromCreatedDate: new Date('2020-05-10T20:25:43.511Z'),
			toCreatedDate: new Date('2020-05-20T21:25:43.511Z'),
			statuses: [1],
			citizenUinFins: ['abc123', 'xyz456'],
			serviceId: 1,
			page: 2,
			limit: 3,
			maxId: 50,
		};

		const instance = await Container.get(BookingsService);
		await instance.searchBookings(searchRequest);

		expect(BookingRepositoryMock.searchBookings).toHaveBeenCalledWith(searchRequest);
	});

	it('should search bookings and return all', async () => {
		const searchRequest: BookingSearchRequest = {
			from: new Date('2020-05-16T20:25:43.511Z'),
			to: new Date('2020-05-16T21:25:43.511Z'),
			fromCreatedDate: new Date('2020-05-10T20:25:43.511Z'),
			toCreatedDate: new Date('2020-05-20T21:25:43.511Z'),
			statuses: [1],
			citizenUinFins: ['abc123', 'xyz456'],
			serviceId: 1,
			page: 2,
			limit: 3,
			maxId: 50,
		};

		const instance = await Container.get(BookingsService);
		await instance.searchBookingsReturnAll(searchRequest);

		expect(BookingRepositoryMock.searchReturnAll).toHaveBeenCalledWith(searchRequest);
	});

	it('should check valid limits', async () => {
		const instance = await Container.get(BookingsService);
		const response = await instance.checkLimit(10, 20);

		expect(response).toBeUndefined();
	});

	it('should return limit error', async () => {
		const instance = await Container.get(BookingsService);
		let error;
		try {
			await instance.checkLimit(10, 1);
		} catch (e) {
			error = e;
		}

		expect(error.message).toEqual(`Maximum rows for export: 1`);
	});

	it('should save booking from booking request', async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);

		const timeslotWithCapacity = createTimeslot(bookingRequest.startDateTime, bookingRequest.endDateTime);
		TimeslotsServiceMock.availableProvidersForTimeslot.set(serviceProvider, timeslotWithCapacity);

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(singpassMock)]));

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.PendingApproval);
		expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
	});

	it('should auto accept booking for citizen (when sp flag = true)', async () => {
		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;
		customProvider.autoAcceptBookings = true;

		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;

		const timeslotWithCapacity = createTimeslot(bookingRequest.startDateTime, bookingRequest.endDateTime);
		TimeslotsServiceMock.availableProvidersForTimeslot.set(customProvider, timeslotWithCapacity);
		ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(Promise.resolve(customProvider));
		ServiceProvidersRepositoryMock.getServiceProviderMock = customProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(singpassMock)]));

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.Accepted);
		expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
	});

	it('should not auto accept booking for citizen (when sp flag = false)', async () => {
		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;
		customProvider.autoAcceptBookings = false;

		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;

		const timeslotWithCapacity = createTimeslot(bookingRequest.startDateTime, bookingRequest.endDateTime);
		TimeslotsServiceMock.availableProvidersForTimeslot.set(customProvider, timeslotWithCapacity);
		ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(Promise.resolve(customProvider));
		ServiceProvidersRepositoryMock.getServiceProviderMock = customProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(singpassMock)]));

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.PendingApproval);
		expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
	});

	it('should always auto accept booking for admins (even when sp flag = false)', async () => {
		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;
		customProvider.autoAcceptBookings = false;

		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;

		const timeslotWithCapacity = createTimeslot(bookingRequest.startDateTime, bookingRequest.endDateTime);
		TimeslotsServiceMock.availableProvidersForTimeslot.set(customProvider, timeslotWithCapacity);
		ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(Promise.resolve(customProvider));
		ServiceProvidersRepositoryMock.getServiceProviderMock = customProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceProviderAuthGroup(adminMock, customProvider)]),
		);

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.Accepted);
		expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
	});

	it('should save direct booking', async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 1;

		const timeslotWithCapacity = createTimeslot(bookingRequest.startDateTime, bookingRequest.endDateTime);
		TimeslotsServiceMock.availableProvidersForTimeslot.set(serviceProvider, timeslotWithCapacity);
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(Promise.resolve(serviceProvider));
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(singpassMock)]));

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.Accepted);
		expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
	});

	it('should allow booking out of timeslots for admin', async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 1;
		bookingRequest.refId = 'RFM186';
		bookingRequest.citizenUinFin = 'NRIC1234';

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(Promise.resolve(serviceProvider));
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
		expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
	});

	it('should not allow booking out of timeslots for citizen', async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.citizenUinFin = 'NRIC1234';

		const timeslotWithCapacity = createTimeslot(bookingRequest.startDateTime, bookingRequest.endDateTime);
		TimeslotsServiceMock.availableProvidersForTimeslot.set(serviceProvider, timeslotWithCapacity);
		UnavailabilitiesServiceMock.isUnavailable.mockReturnValue(false);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
	});

	it('should accept booking', async () => {
		const bookingService = Container.get(BookingsService);
		BookingRepositoryMock.booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		const timeslotWithCapacity = createTimeslot(
			BookingRepositoryMock.booking.startDateTime,
			BookingRepositoryMock.booking.endDateTime,
			1,
		);
		TimeslotsServiceMock.isProviderAvailableForTimeslot.mockReturnValue(Promise.resolve(true));
		TimeslotsServiceMock.availableProvidersForTimeslot.set(serviceProvider, timeslotWithCapacity);
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		const acceptRequest = new BookingAcceptRequest();
		acceptRequest.serviceProviderId = 1;
		const result = await bookingService.acceptBooking(1, acceptRequest);

		expect(result.status).toBe(BookingStatus.Accepted);
	});

	it('should accept booking with pre selected service provider', async () => {
		const bookingService = Container.get(BookingsService);
		BookingRepositoryMock.booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		BookingRepositoryMock.booking.serviceProviderId = 1;

		TimeslotsServiceMock.availableProvidersForTimeslot = new Map<ServiceProvider, TimeslotWithCapacity>();
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		const acceptRequest = new BookingAcceptRequest();
		acceptRequest.serviceProviderId = 1;
		const result = await bookingService.acceptBooking(1, acceptRequest);

		expect(result.status).toBe(BookingStatus.Accepted);
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
		const timeslotWithCapacity = createTimeslot(
			BookingRepositoryMock.booking.startDateTime,
			BookingRepositoryMock.booking.endDateTime,
		);
		TimeslotsServiceMock.availableProvidersForTimeslot.set(serviceProvider, timeslotWithCapacity);
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		const bookingService = Container.get(BookingsService);
		const result = await bookingService.cancelBooking(1);

		expect(result.status).toBe(BookingStatus.Cancelled);
		expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
	});

	it('should throw exception if booking not found', async () => {
		const bookingService = Container.get(BookingsService);
		BookingRepositoryMock.booking = undefined;
		await expect(async () => await bookingService.getBooking(1)).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Booking 1 not found'),
		);
	});

	it('should update booking except NRIC', async () => {
		const bookingService = Container.get(BookingsService);

		const start = new Date('2020-02-02T11:00');
		const end = new Date('2020-02-02T12:00');
		const bookingRequest = {
			refId: 'ref1',
			startDateTime: start,
			endDateTime: end,
			citizenEmail: 'test@mail.com',
			citizenName: 'Jake',
			citizenUinFin: 'S****208A',
			citizenUinFinUpdated: false,
		} as BookingUpdateRequest;

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

		const booking = await bookingService.update(1, bookingRequest);

		expect(booking.refId).toBe('ref1');
		expect(booking.citizenEmail).toBe('test@mail.com');
		expect(booking.citizenName).toBe('Jake');
		expect(booking.citizenUinFin).not.toBe('S6979208A');
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
			citizenUinFinUpdated: true,
		} as BookingUpdateRequest;

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

		const booking = await bookingService.update(1, bookingRequest);

		expect(booking.refId).toBe('ref1');
		expect(booking.citizenEmail).toBe('test@mail.com');
		expect(booking.citizenName).toBe('Jake');
		expect(booking.citizenUinFin).toBe('S6979208A');
		expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
	});

	it('should call log with reschedule action', async () => {
		const bookingService = Container.get(BookingsService);
		const bookingUpdateRequest = getUpdateBookingRequest();

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

		await bookingService.update(1, bookingUpdateRequest);

		expect(BookingChangeLogsServiceMock.action).toStrictEqual(ChangeLogAction.Reschedule);
	});

	it('should call log with update action', async () => {
		const bookingService = Container.get(BookingsService);
		const bookingUpdateRequest = getUpdateBookingRequest();

		BookingRepositoryMock.booking = new BookingBuilder()
			.withServiceId(service.id)
			.withCitizenEmail('test@mail.com')
			.withStartDateTime(bookingUpdateRequest.startDateTime)
			.withEndDateTime(bookingUpdateRequest.endDateTime)
			.build();

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		await bookingService.update(1, bookingUpdateRequest);

		expect(BookingChangeLogsServiceMock.action).toStrictEqual(ChangeLogAction.Update);
	});

	it('should call log with update action when updating service provider', async () => {
		const bookingService = Container.get(BookingsService);
		const bookingUpdateRequest = getUpdateBookingRequest();

		BookingRepositoryMock.booking = new BookingBuilder()
			.withServiceId(service.id)
			.withCitizenEmail(bookingUpdateRequest.citizenEmail)
			.withStartDateTime(bookingUpdateRequest.startDateTime)
			.withEndDateTime(bookingUpdateRequest.endDateTime)
			.withServiceProviderId(1)
			.build();

		bookingUpdateRequest.serviceProviderId = 123;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		await bookingService.update(1, bookingUpdateRequest);

		expect(BookingChangeLogsServiceMock.action).toStrictEqual(ChangeLogAction.Update);
	});

	it('should reject booking without reason', async () => {
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

		const result = await bookingService.rejectBooking(1, {
			reasonToReject: undefined,
		} as BookingReject);

		expect(result.status).toBe(BookingStatus.Rejected);
	});

	it('should reject booking with reason', async () => {
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

		const result = await bookingService.rejectBooking(1, {
			reasonToReject: "this is the reason i'm rejecting it",
		} as BookingReject);

		expect(result.status).toBe(BookingStatus.Rejected);
	});

	describe('Validate on hold booking', () => {
		it('should validate on hold booking and change status to accepted', async () => {
			const bookingService = Container.get(BookingsService);
			const newServiceProvider = ServiceProvider.create('provider', 1);
			newServiceProvider.id = 1;
			newServiceProvider.autoAcceptBookings = true;
			ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(Promise.resolve(newServiceProvider));
			ServiceProvidersRepositoryMock.getServiceProviderMock = newServiceProvider;
			const start = new Date('2020-02-02T11:00');
			const end = new Date('2020-02-02T12:00');

			const bookingRequest = {
				citizenEmail: 'test@mail.com',
				citizenName: 'Jake',
				citizenUinFin: 'S6979208A',
				serviceProviderId: 1,
			} as BookingRequest;

			BookingRepositoryMock.booking = new BookingBuilder()
				.withServiceId(1)
				.withServiceProviderId(1)
				.withStartDateTime(start)
				.withEndDateTime(end)
				.withAutoAccept(true)
				.withMarkOnHold(true)
				.build();

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
			);

			const result = await bookingService.validateOnHoldBooking(1, bookingRequest);

			expect(result.status).toBe(BookingStatus.Accepted);
			expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
		});

		it('should validate on hold booking and change status to pending', async () => {
			const bookingService = Container.get(BookingsService);
			const sp = ServiceProvider.create('provider', 1);
			sp.id = 1;
			sp.autoAcceptBookings = false;
			ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(Promise.resolve(sp));
			ServiceProvidersRepositoryMock.getServiceProviderMock = sp;
			const start = new Date('2020-02-02T11:00');
			const end = new Date('2020-02-02T12:00');

			const bookingRequest = {
				citizenEmail: 'test@mail.com',
				citizenName: 'Jake',
				citizenUinFin: 'S6979208A',
				serviceProviderId: 1,
			} as BookingRequest;

			BookingRepositoryMock.booking = new BookingBuilder()
				.withServiceId(1)
				.withServiceProviderId(1)
				.withStartDateTime(start)
				.withEndDateTime(end)
				.withAutoAccept(false)
				.withMarkOnHold(true)
				.build();

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
			);

			const result = await bookingService.validateOnHoldBooking(1, bookingRequest);

			expect(result.status).toBe(BookingStatus.PendingApproval);
		});

		it('should not validate on hold booking', async () => {
			const bookingService = Container.get(BookingsService);
			const serviceProv = ServiceProvider.create('provider', 1);
			serviceProv.id = 1;
			serviceProv.autoAcceptBookings = false;
			ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(Promise.resolve(serviceProv));
			ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProv;
			const start = new Date('2020-02-02T11:00');
			const end = new Date('2020-02-02T12:00');

			const bookingRequest = {
				citizenEmail: 'test@mail.com',
				citizenName: 'Jake',
				citizenUinFin: 'S6979208A',
				serviceProviderId: 1,
			} as BookingRequest;

			BookingRepositoryMock.booking = new BookingBuilder()
				.withServiceId(1)
				.withServiceProviderId(1)
				.withStartDateTime(start)
				.withEndDateTime(end)
				.withAutoAccept(false)
				.withMarkOnHold(false)
				.build();

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
			);
			await expect(
				async () => await bookingService.validateOnHoldBooking(1, bookingRequest),
			).rejects.toThrowError();
			expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(0);
		});

		it('should save a new booking with a valid video conference url from booking request', async () => {
			const bookingRequest: BookingRequest = new BookingRequest();
			bookingRequest.startDateTime = new Date();
			bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
			bookingRequest.videoConferenceUrl = 'www.google.com';

			const timeslotWithCapacity = createTimeslot(bookingRequest.startDateTime, bookingRequest.endDateTime);
			TimeslotsServiceMock.availableProvidersForTimeslot.set(serviceProvider, timeslotWithCapacity);

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);

			await Container.get(BookingsService).save(bookingRequest, 1);
			const booking = BookingRepositoryMock.booking;

			expect(booking).not.toBe(undefined);
			expect(booking.videoConferenceUrl).toBe('www.google.com');
			expect(booking.status).toBe(BookingStatus.PendingApproval);
		});

		it('should update booking with a valid video conference url', async () => {
			const bookingService = Container.get(BookingsService);

			const start = new Date('2020-02-02T11:00');
			const end = new Date('2020-02-02T12:00');
			const bookingRequest = {
				refId: 'ref1',
				startDateTime: start,
				endDateTime: end,
				citizenEmail: 'test@mail.com',
				videoConferenceUrl: 'www.google.com',
			} as BookingUpdateRequest;

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

			const booking = await bookingService.update(1, bookingRequest);

			expect(booking.refId).toBe('ref1');
			expect(booking.videoConferenceUrl).toBe('www.google.com');
		});
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

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);

			const result = await bookingService.reschedule(1, rescheduleRequest);
			expect(BookingChangeLogsServiceMock.action).toStrictEqual(ChangeLogAction.Reschedule);
			expect(result.status).toStrictEqual(BookingStatus.PendingApproval);
			expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
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

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
			);

			await expect(async () => await bookingService.reschedule(1, rescheduleRequest)).rejects.toThrowError();
		});
	});

	describe('On Hold', () => {
		const onHoldService = new Service();
		onHoldService.id = 2;
		onHoldService.isOnHold = true;
		const onHoldServiceProvider = ServiceProvider.create('provider', 2);
		onHoldServiceProvider.id = 2;
		it('should mark booking as onhold and set the onhold current timestamp', async () => {
			const bookingRequest: BookingRequest = new BookingRequest();
			bookingRequest.startDateTime = new Date();
			bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
			bookingRequest.serviceProviderId = 2;

			const timeslotWithCapacity = createTimeslot(bookingRequest.startDateTime, bookingRequest.endDateTime);
			TimeslotsServiceMock.availableProvidersForTimeslot.set(onHoldServiceProvider, timeslotWithCapacity);

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);
			ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(onHoldService));

			await Container.get(BookingsService).save(bookingRequest, 2);

			const booking = BookingRepositoryMock.booking;
			const onHoldDateTime: any = new Date(booking.onHoldUntil);
			const timeNow: any = new Date();
			const diffTimeinMins = Math.abs(onHoldDateTime - timeNow) / (1000 * 60);
			expect(booking).not.toBe(undefined);
			expect(booking.status).toBe(BookingStatus.OnHold);
			expect(booking.onHoldUntil).toBeInstanceOf(Date);
			expect(booking.onHoldUntil).not.toBeNull();
			expect(ceil(diffTimeinMins)).toEqual(10);
			expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
		});
	});

	describe('Stand alone', () => {
		const standAloneService = new Service();
		standAloneService.id = 10;
		const standAloneServiceProvider = ServiceProvider.create('provider', 10);
		standAloneServiceProvider.id = 1;
		it('Should make an on hold booking if isStandAlone is set to true on service', async () => {
			standAloneService.isStandAlone = true;
			standAloneService.isOnHold = false;

			const bookingRequest: BookingRequest = new BookingRequest();
			bookingRequest.startDateTime = new Date();
			bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
			bookingRequest.serviceProviderId = 1;

			const timeslotWithCapacity = createTimeslot(bookingRequest.startDateTime, bookingRequest.endDateTime);
			TimeslotsServiceMock.availableProvidersForTimeslot.set(standAloneServiceProvider, timeslotWithCapacity);

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);
			ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(standAloneService));

			await Container.get(BookingsService).save(bookingRequest, 10);

			const booking = BookingRepositoryMock.booking;
			const onHoldDateTime: any = new Date(booking.onHoldUntil);
			const timeNow: any = new Date();
			const diffTimeinMins = Math.abs(onHoldDateTime - timeNow) / (1000 * 60);
			expect(booking).not.toBe(undefined);
			expect(booking.status).toBe(BookingStatus.OnHold);
			expect(booking.onHoldUntil).toBeInstanceOf(Date);
			expect(booking.onHoldUntil).not.toBeNull();
			expect(ceil(diffTimeinMins)).toEqual(10);
		});

		it('Should not make an on hold booking if isStandAlone is set to false on service', async () => {
			standAloneService.isStandAlone = false;
			standAloneService.isOnHold = false;

			const bookingRequest: BookingRequest = new BookingRequest();
			bookingRequest.startDateTime = new Date();
			bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
			bookingRequest.serviceProviderId = 1;

			const timeslotWithCapacity = createTimeslot(bookingRequest.startDateTime, bookingRequest.endDateTime);
			TimeslotsServiceMock.availableProvidersForTimeslot.set(standAloneServiceProvider, timeslotWithCapacity);

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);
			ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(standAloneService));

			await Container.get(BookingsService).save(bookingRequest, 10);

			const booking = BookingRepositoryMock.booking;
			expect(booking).not.toBe(undefined);
			expect(booking.status).toBe(BookingStatus.PendingApproval);
		});
	});

	describe('Service provider auto assigned', () => {
		const spAutoAssignedService = new Service();
		spAutoAssignedService.id = 10;
		spAutoAssignedService.isSpAutoAssigned = true;

		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;

		let bookingRequest: BookingRequest;

		beforeEach(() => {
			ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(spAutoAssignedService));
			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);
			bookingRequest = new BookingRequest();
			bookingRequest.startDateTime = new Date();
			bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
			(randomIndex as jest.Mock).mockReturnValue(0);
		});

		it('should  select random SP (even when  spAutoAssigned flag = true)', async () => {
			ServiceProvidersServiceMock.getAvailableServiceProvidersMock.mockReturnValue([customProvider]);

			await Container.get(BookingsService).save(bookingRequest, 10);

			expect(ServiceProvidersServiceMock.getAvailableServiceProvidersMock).toHaveBeenCalledTimes(1);
			expect(randomIndex as jest.Mock).toHaveBeenCalledTimes(1);
			const booking = BookingRepositoryMock.booking;
			expect(booking.serviceProvider).toBe(customProvider);
		});

		it('should not select random SP if request as serviceProviderId (even when  spAutoAssigned flag = true)', async () => {
			bookingRequest.serviceProviderId = 1;

			await Container.get(BookingsService).save(bookingRequest, 10);

			expect(ServiceProvidersServiceMock.getAvailableServiceProvidersMock).toHaveBeenCalledTimes(0);
			expect(ServiceProvidersServiceMock.getServiceProviderMock).toHaveBeenCalled();
			expect(randomIndex as jest.Mock).toHaveBeenCalledTimes(0);
			const booking = BookingRepositoryMock.booking;
			expect(booking.serviceProvider).toBe(undefined);
		});
	});
});
