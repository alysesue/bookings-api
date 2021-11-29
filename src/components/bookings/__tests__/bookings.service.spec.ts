import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { BookingsService } from '../index';
import { BookingsRepository } from '../bookings.repository';
import { Container } from 'typescript-ioc';
import {
	Booking,
	BookingStatus,
	ChangeLogAction,
	Organisation,
	Service,
	ServiceProvider,
	TimeslotsSchedule,
	User,
	Event,
	OneOffTimeslot,
	BookedSlot,
} from '../../../models';
import {
	BookingAcceptRequestV1,
	BookingReject,
	BookingRequestV1,
	BookingSearchRequest,
	BookingUpdateRequestV1,
	EventBookingRequest,
} from '../bookings.apicontract';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { UnavailabilitiesService } from '../../unavailabilities/unavailabilities.service';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { BookingBuilder } from '../../../models/entities/booking';
import { BookingsValidatorFactory, IBookingsValidator } from '../validator/bookings.validation';
import { BookingsEventValidatorFactory } from '../validator/bookings.event.validation';
import {
	BookingActionFunction,
	BookingChangeLogsService,
	GetBookingFunction,
} from '../../bookingChangeLogs/bookingChangeLogs.service';
import { ServicesService } from '../../services/services.service';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	OtpAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import {
	BookingChangeLogsServiceMock,
	BookingRepositoryMock,
	TimeslotsServiceMock,
	UnavailabilitiesServiceMock,
} from '../__mocks__/bookings.mocks';
import { ServiceProvidersService } from '../../serviceProviders/serviceProviders.service';
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
import { TimeslotServiceProviderResult } from '../../../models/timeslotServiceProvider';
import * as uuid from 'uuid';
import { ServiceProvidersRepositoryMock } from '../../../components/serviceProviders/__mocks__/serviceProviders.repository.mock';
import { BookedSlotRepository } from '../bookedSlot.repository';
import { BookedSlotRepositoryMock } from '../__mocks__/bookedSlot.repository.mock';
import { BookingValidationType, BookingWorkflowType } from '../../../models/bookingValidationType';
import { BookingWorkflowsRepository } from '../../../components/bookingWorkflows/bookingWorkflows.repository';
import { BookingWorkflowsRepositoryMock } from '../../../components/bookingWorkflows/__mocks__/bookingWorkflows.repository.mock';
import { MyInfoService } from '../../myInfo/myInfo.service';
import { MyInfoServiceeMock } from '../../myInfo/__mocks__/myInfo.service.mock';
import { EventsService } from '../../events/events.service';
import { EventsServiceMock } from '../../events/__mocks__/events.service.mock';
import { CitizenAuthenticationType } from '../../../models/citizenAuthenticationType';
import { BookingActionAuthVisitor } from '../bookings.auth';
import {
	DynamicValuesRequestMapper,
	MapRequestOptionalResult,
} from '../../../components/dynamicFields/dynamicValues.mapper';
import { DynamicValuesRequestMapperMock } from '../../../components/dynamicFields/__mocks__/dynamicValues.mapper.mock';
import { BookingType } from '../../../models/bookingType';
import { UsersServiceMock } from '../../../components/users/__mocks__/users.service';

jest.mock('../../../tools/arrays');
jest.mock('../bookings.auth', () => ({ BookingActionAuthVisitor: jest.fn() }));

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
	} as BookingUpdateRequestV1;
}

// tslint:disable-next-line: no-big-function
describe('Bookings.Service', () => {
	const organisation = new Organisation();
	organisation.id = 123;

	let service: Service;

	const serviceProvider = ServiceProvider.create('provider', 1);
	serviceProvider.id = 1;

	const timeslotSchedule = new TimeslotsSchedule();
	timeslotSchedule._id = 1;
	timeslotSchedule._serviceProvider = serviceProvider;

	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});
	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
	singpassMock.id = 45;
	const otpMock = User.createOtpUser('+6584000000');
	otpMock.id = 46;
	const anonymousMock = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
	const agencyMock = User.createAgencyUser({
		agencyAppId: 'some-app',
		agencyName: 'some',
	});

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

	class BookingEventValidatorFactoryMock implements Partial<BookingsEventValidatorFactory> {
		public getValidator(): IBookingsValidator {
			return validatorMock;
		}
		public getOnHoldValidator(): IBookingsValidator {
			return onHolValidatorMock;
		}
	}

	const bookingActionVisitorMock: Partial<BookingActionAuthVisitor> = {
		hasPermission: jest.fn(),
	};

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
		Container.bind(BookingsEventValidatorFactory).to(BookingEventValidatorFactoryMock);
		Container.bind(BookingChangeLogsService).to(BookingChangeLogsServiceMock);
		Container.bind(ServicesService).to(ServicesServiceMock);
		Container.bind(UsersService).to(UsersServiceMock);
		Container.bind(BookingsSubject).to(BookingsSubjectMock);
		Container.bind(MailObserver).to(MockObserver);
		Container.bind(BookingWorkflowsRepository).to(BookingWorkflowsRepositoryMock);
		Container.bind(MyInfoService).to(MyInfoServiceeMock);
		Container.bind(BookedSlotRepository).to(BookedSlotRepositoryMock);
		Container.bind(EventsService).to(EventsServiceMock);
		Container.bind(DynamicValuesRequestMapper).to(DynamicValuesRequestMapperMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		service = new Service();
		service.id = 1;
		service.organisation = organisation;
		service.organisationId = organisation.id;
		service.citizenAuthentication = [CitizenAuthenticationType.Singpass, CitizenAuthenticationType.Otp];

		(bookingActionVisitorMock.hasPermission as jest.Mock).mockReturnValue(true);
		(BookingActionAuthVisitor as jest.Mock).mockReturnValue(bookingActionVisitorMock);

		BookingChangeLogsServiceMock.action = undefined;
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

		TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => Promise.resolve([]));

		BookingRepositoryMock.searchBookings.mockImplementation(() =>
			Promise.resolve({ entries: [] } as IPagedEntities<Booking>),
		);
		BookingRepositoryMock.searchReturnAll.mockImplementation(() => Promise.resolve([]));

		BookingRepositoryMock.update.mockImplementation(async (b) => {
			return b;
		});

		UsersServiceMock.persistUserIfRequired.mockImplementation((u) => Promise.resolve(u));

		UserContextMock.getOtpAddOnMobileNo.mockReturnValue(undefined);
		UserContextMock.getMyInfo.mockReturnValue(Promise.resolve(undefined));

		DynamicValuesRequestMapperMock.mapDynamicValues.mockImplementation(
			async () => ({ result: [] } as MapRequestOptionalResult),
		);
		DynamicValuesRequestMapperMock.updateMyInfoDynamicFromUser.mockImplementation(async (values, _svcId) => values);

		UsersServiceMock.getOrSaveSingpassUser.mockImplementation(() => Promise.resolve(singpassMock));
		UsersServiceMock.getOtpUser.mockImplementation(() => Promise.resolve(otpMock));
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

	describe('search booking with booking token', () => {
		const searchRequest: BookingSearchRequest = {
			page: 2,
			limit: 3,
			bookingToken: '66623746-ca76-4406-8138-0ca7ab0486cc',
		};
		it('should return booking if valid singpass', async () => {
			const booking = new Booking();
			booking.id = 1;
			booking.citizenAuthType = CitizenAuthenticationType.Singpass;
			BookingRepositoryMock.searchBookings
				.mockReturnValueOnce(Promise.resolve({ entries: [] } as IPagedEntities<Booking>))
				.mockReturnValueOnce(Promise.resolve({ entries: [booking] } as IPagedEntities<Booking>));
			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);

			const instance = Container.get(BookingsService);
			const response = await instance.searchBookings(searchRequest);
			expect(response.entries[0].id).toBe(1);
		});

		it('should return booking if valid otp', async () => {
			const booking = new Booking();
			booking.id = 1;
			booking.citizenAuthType = CitizenAuthenticationType.Otp;
			BookingRepositoryMock.searchBookings
				.mockReturnValueOnce(Promise.resolve({ entries: [] } as IPagedEntities<Booking>))
				.mockReturnValueOnce(Promise.resolve({ entries: [booking] } as IPagedEntities<Booking>));
			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(otpMock));
			UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(otpMock)]));

			const instance = Container.get(BookingsService);
			const response = await instance.searchBookings(searchRequest);
			expect(response.entries[0].id).toBe(1);
		});

		it('should not return booking if auth type does not match (without owner id) - Singpass Auth with OTP user', async () => {
			const booking = new Booking();
			booking.id = 1;
			booking.citizenAuthType = CitizenAuthenticationType.Singpass;
			BookingRepositoryMock.searchBookings
				.mockReturnValueOnce(Promise.resolve({ entries: [] } as IPagedEntities<Booking>))
				.mockReturnValueOnce(Promise.resolve({ entries: [booking] } as IPagedEntities<Booking>));
			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(otpMock));
			UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(otpMock)]));

			const instance = Container.get(BookingsService);
			const response = await instance.searchBookings(searchRequest);
			expect(response.entries.length).toBe(0);
		});

		it('should not return booking if auth type does not match (without owner id) - OTP Auth with Singpass user', async () => {
			const booking = new Booking();
			booking.id = 1;
			booking.citizenAuthType = CitizenAuthenticationType.Otp;
			BookingRepositoryMock.searchBookings
				.mockReturnValueOnce(Promise.resolve({ entries: [] } as IPagedEntities<Booking>))
				.mockReturnValueOnce(Promise.resolve({ entries: [booking] } as IPagedEntities<Booking>));
			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);

			const instance = Container.get(BookingsService);
			const response = await instance.searchBookings(searchRequest);
			expect(response.entries.length).toBe(0);
		});

		it('should not return booking if auth type match but with owner id', async () => {
			const booking = new Booking();
			booking.id = 1;
			booking.citizenAuthType = CitizenAuthenticationType.Singpass;
			booking.ownerId = 1;
			BookingRepositoryMock.searchBookings
				.mockReturnValueOnce(Promise.resolve({ entries: [] } as IPagedEntities<Booking>))
				.mockReturnValueOnce(Promise.resolve({ entries: [booking] } as IPagedEntities<Booking>));
			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);

			const instance = Container.get(BookingsService);
			const response = await instance.searchBookings(searchRequest);
			expect(response.entries.length).toBe(0);
		});
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

	it('should save booking from booking request (anonymous user)', async () => {
		const bookingRequest: BookingRequestV1 = new BookingRequestV1();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.citizenName = 'this should be the name';
		bookingRequest.citizenEmail = 'correctemail@gmail.com';
		bookingRequest.citizenPhone = '93328223';

		const anonymousService = new Service();
		anonymousService.id = 1;
		anonymousService.citizenAuthentication = [CitizenAuthenticationType.Otp];
		anonymousService.isStandAlone = false;

		ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(anonymousService));
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(anonymousMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new AnonymousAuthGroup(anonymousMock, undefined, { mobileNo: '+6584000000' })]),
		);

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.PendingApproval);
		expect(booking.citizenName).toBe(bookingRequest.citizenName);
		expect(booking.citizenEmail).toBe(bookingRequest.citizenEmail);
		expect(booking.citizenPhone).toBe(bookingRequest.citizenPhone);
		expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
		expect(bookingActionVisitorMock.hasPermission).toBeCalled();
	});

	it('should NOT save booking from booking request (when not authorised)', async () => {
		const bookingRequest: BookingRequestV1 = new BookingRequestV1();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.citizenName = 'this should be the name';
		bookingRequest.citizenEmail = 'correctemail@gmail.com';
		bookingRequest.citizenPhone = '93328223';

		const anonymousService = new Service();
		anonymousService.id = 1;
		anonymousService.citizenAuthentication = [CitizenAuthenticationType.Otp];
		anonymousService.isStandAlone = false;

		ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(anonymousService));
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(anonymousMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new AnonymousAuthGroup(anonymousMock, undefined, { mobileNo: '+6584000000' })]),
		);

		(bookingActionVisitorMock.hasPermission as jest.Mock).mockReturnValue(false);

		const asyncTest = async () => await Container.get(BookingsService).save(bookingRequest, 1);

		await expect(asyncTest).rejects.toMatchInlineSnapshot(
			'[SYS_INVALID_AUTHORIZATION (403): User cannot perform this booking action (1) for this service.]',
		);
		expect(bookingActionVisitorMock.hasPermission).toBeCalled();
	});

	describe('booking owner tests', () => {
		describe('create of booking', () => {
			it('should save booking from booking request (singpass user)', async () => {
				const bookingRequest: BookingRequestV1 = new BookingRequestV1();
				bookingRequest.startDateTime = new Date();
				bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
				bookingRequest.citizenName = 'this should be the name';
				bookingRequest.citizenEmail = 'correctemail@gmail.com';
				bookingRequest.citizenPhone = '93328223';

				const standaloneService = new Service();
				standaloneService.id = 1;
				standaloneService.citizenAuthentication = [CitizenAuthenticationType.Singpass];
				standaloneService.isStandAlone = true;

				ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(standaloneService));
				TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
					return Promise.resolve([
						{
							serviceProvider,
							capacity: 1,
							acceptedBookings: [],
							pendingBookings: [],
							availabilityCount: 1,
						} as TimeslotServiceProviderResult,
					]);
				});

				UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
				UserContextMock.getAuthGroups.mockImplementation(() =>
					Promise.resolve([new CitizenAuthGroup(singpassMock)]),
				);

				await Container.get(BookingsService).save(bookingRequest, 1);

				const booking = BookingRepositoryMock.booking;
				expect(booking).not.toBe(undefined);
				expect(booking.status).toBe(BookingStatus.OnHold);
				expect(booking.citizenName).toBe('this should be the name');
				expect(booking.citizenEmail).toBe('correctemail@gmail.com');
				expect(booking.citizenPhone).toBe('93328223');
				expect(booking.creator).toBe(singpassMock);
				expect(booking.owner).toBe(singpassMock);
				expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
				expect(bookingActionVisitorMock.hasPermission).toBeCalled();
			});

			it('should save booking from booking request (otp user)', async () => {
				const bookingRequest: BookingRequestV1 = new BookingRequestV1();
				bookingRequest.startDateTime = new Date();
				bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
				bookingRequest.citizenName = 'this should be the name';
				bookingRequest.citizenEmail = 'correctemail@gmail.com';
				bookingRequest.citizenPhone = '93328223';

				const standaloneService = new Service();
				standaloneService.id = 1;
				standaloneService.citizenAuthentication = [CitizenAuthenticationType.Otp];
				standaloneService.isStandAlone = true;

				ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(standaloneService));
				TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
					return Promise.resolve([
						{
							serviceProvider,
							capacity: 1,
							acceptedBookings: [],
							pendingBookings: [],
							availabilityCount: 1,
						} as TimeslotServiceProviderResult,
					]);
				});

				UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(otpMock));
				UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new OtpAuthGroup(otpMock)]));

				await Container.get(BookingsService).save(bookingRequest, 1);

				const booking = BookingRepositoryMock.booking;
				expect(booking).not.toBe(undefined);
				expect(booking.status).toBe(BookingStatus.OnHold);
				expect(booking.citizenName).toBe('this should be the name');
				expect(booking.citizenEmail).toBe('correctemail@gmail.com');
				expect(booking.citizenPhone).toBe('93328223');
				expect(booking.creator).toBe(otpMock);
				expect(booking.owner).toBe(otpMock);
				expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
				expect(bookingActionVisitorMock.hasPermission).toBeCalled();
			});
			it('should save booking from booking request (otp user) - action by admin', async () => {
				const bookingRequest: BookingRequestV1 = new BookingRequestV1();
				bookingRequest.startDateTime = new Date();
				bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
				bookingRequest.citizenName = 'this should be the name';
				bookingRequest.citizenEmail = 'correctemail@gmail.com';
				bookingRequest.citizenPhone = '93328223';

				const standaloneService = new Service();
				standaloneService.id = 1;
				standaloneService.citizenAuthentication = [CitizenAuthenticationType.Otp];
				standaloneService.isStandAlone = true;

				ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(standaloneService));
				TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
					return Promise.resolve([
						{
							serviceProvider,
							capacity: 1,
							acceptedBookings: [],
							pendingBookings: [],
							availabilityCount: 1,
						} as TimeslotServiceProviderResult,
					]);
				});

				UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
				UserContextMock.getAuthGroups.mockImplementation(() =>
					Promise.resolve([new OrganisationAdminAuthGroup(adminMock, [organisation])]),
				);

				await Container.get(BookingsService).save(bookingRequest, 1);

				const booking = BookingRepositoryMock.booking;
				expect(booking).not.toBe(undefined);
				expect(booking.status).toBe(BookingStatus.PendingApproval);
				expect(booking.citizenName).toBe('this should be the name');
				expect(booking.citizenEmail).toBe('correctemail@gmail.com');
				expect(booking.citizenPhone).toBe('93328223');
				expect(booking.creator).toBe(adminMock);
				expect(booking.owner).toBe(otpMock);
				expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
				expect(bookingActionVisitorMock.hasPermission).toBeCalled();
			});

			it('should save booking from booking request (singpass user) - action by admin', async () => {
				const bookingRequest: BookingRequestV1 = new BookingRequestV1();
				bookingRequest.startDateTime = new Date();
				bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
				bookingRequest.citizenName = 'this should be the name';
				bookingRequest.citizenEmail = 'correctemail@gmail.com';
				bookingRequest.citizenPhone = '93328223';

				const standaloneService = new Service();
				standaloneService.id = 1;
				standaloneService.citizenAuthentication = [CitizenAuthenticationType.Singpass];
				standaloneService.isStandAlone = true;

				ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(standaloneService));
				TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
					return Promise.resolve([
						{
							serviceProvider,
							capacity: 1,
							acceptedBookings: [],
							pendingBookings: [],
							availabilityCount: 1,
						} as TimeslotServiceProviderResult,
					]);
				});

				UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
				UserContextMock.getAuthGroups.mockImplementation(() =>
					Promise.resolve([new OrganisationAdminAuthGroup(adminMock, [organisation])]),
				);

				await Container.get(BookingsService).save(bookingRequest, 1);

				const booking = BookingRepositoryMock.booking;
				expect(booking).not.toBe(undefined);
				expect(booking.status).toBe(BookingStatus.PendingApproval);
				expect(booking.citizenName).toBe('this should be the name');
				expect(booking.citizenEmail).toBe('correctemail@gmail.com');
				expect(booking.citizenPhone).toBe('93328223');
				expect(booking.creator).toBe(adminMock);
				expect(booking.owner).toBe(singpassMock);
				expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
				expect(bookingActionVisitorMock.hasPermission).toBeCalled();
			});
		});

		// TODO
		describe('(for backwards compatibility) update - without existing owner id', () => {
			it('should update owner id when admin updates the booking (OTP)', async () => {
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
				} as BookingUpdateRequestV1;

				BookingRepositoryMock.booking = new BookingBuilder()
					.withServiceId(service.id)
					.withCitizenEmail('test@mail.com')
					.withStartDateTime(start)
					.withEndDateTime(end)
					.withCitizenAuthType(CitizenAuthenticationType.Otp)
					.build();

				UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
				UserContextMock.getAuthGroups.mockImplementation(() =>
					Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
				);

				const booking = await bookingService.update(1, bookingRequest);
				expect(booking.ownerId).toBe(otpMock.id);
			});

			it('should update owner id when admin updates the booking (Singpass)', async () => {
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
				} as BookingUpdateRequestV1;

				BookingRepositoryMock.booking = new BookingBuilder()
					.withServiceId(service.id)
					.withCitizenEmail('test@mail.com')
					.withStartDateTime(start)
					.withEndDateTime(end)
					.withCitizenAuthType(CitizenAuthenticationType.Singpass)
					.build();

				UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
				UserContextMock.getAuthGroups.mockImplementation(() =>
					Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
				);

				const booking = await bookingService.update(1, bookingRequest);
				expect(booking.ownerId).toBe(singpassMock.id);
			});

			it('should update owner id when citizen updates the booking (Singpass)', async () => {
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
				} as BookingUpdateRequestV1;

				BookingRepositoryMock.booking = new BookingBuilder()
					.withServiceId(service.id)
					.withCitizenEmail('test@mail.com')
					.withStartDateTime(start)
					.withEndDateTime(end)
					.withCitizenAuthType(CitizenAuthenticationType.Singpass)
					.build();

				UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
				UserContextMock.getAuthGroups.mockImplementation(() =>
					Promise.resolve([new CitizenAuthGroup(singpassMock)]),
				);

				const booking = await bookingService.update(1, bookingRequest);
				expect(booking.ownerId).toBe(singpassMock.id);
			});

			it('should update owner id when citizen updates the booking (OTP)', async () => {
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
				} as BookingUpdateRequestV1;

				BookingRepositoryMock.booking = new BookingBuilder()
					.withServiceId(service.id)
					.withCitizenEmail('test@mail.com')
					.withStartDateTime(start)
					.withEndDateTime(end)
					.withCitizenAuthType(CitizenAuthenticationType.Otp)
					.build();

				UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(otpMock));
				UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new OtpAuthGroup(otpMock)]));

				const booking = await bookingService.update(1, bookingRequest);
				expect(booking.ownerId).toBe(otpMock.id);
			});
		});

		describe('(for backwards compatibility) validateOnHold - without existing owner id', () => {
			it('should update owner id when citizen updates the booking (OTP)', async () => {
				const bookingService = Container.get(BookingsService);
				const start = new Date('2020-02-02T11:00');
				const end = new Date('2020-02-02T12:00');

				const bookingRequest = {
					citizenEmail: 'test@mail.com',
					citizenName: 'Jake',
					citizenUinFin: 'S6979208A',
				} as BookingRequestV1;

				BookingRepositoryMock.booking = new BookingBuilder()
					.withServiceId(1)
					.withStartDateTime(start)
					.withEndDateTime(end)
					.withAutoAccept(true)
					.withMarkOnHold(true)
					.withCitizenAuthType(CitizenAuthenticationType.Otp)
					.build();

				UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(otpMock));
				UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new OtpAuthGroup(otpMock)]));

				const result = await bookingService.validateOnHoldBooking(1, bookingRequest, true);

				expect(result.ownerId).toBe(otpMock.id);
			});

			it('should update owner id when citizen updates the booking (Singpass)', async () => {
				const bookingService = Container.get(BookingsService);
				const start = new Date('2020-02-02T11:00');
				const end = new Date('2020-02-02T12:00');

				const bookingRequest = {
					citizenEmail: 'test@mail.com',
					citizenName: 'Jake',
					citizenUinFin: 'S6979208A',
				} as BookingRequestV1;

				BookingRepositoryMock.booking = new BookingBuilder()
					.withServiceId(1)
					.withStartDateTime(start)
					.withEndDateTime(end)
					.withAutoAccept(true)
					.withMarkOnHold(true)
					.withCitizenAuthType(CitizenAuthenticationType.Singpass)
					.build();

				UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
				UserContextMock.getAuthGroups.mockImplementation(() =>
					Promise.resolve([new CitizenAuthGroup(singpassMock)]),
				);

				const result = await bookingService.validateOnHoldBooking(1, bookingRequest, true);

				expect(result.ownerId).toBe(singpassMock.id);
			});
		});

		describe('(for backwards compatibility) validateOnHoldEvent - without existing owner id', () => {
			it('should update owner id when citizen updates the booking (OTP)', async () => {
				const bookingService = Container.get(BookingsService);
				const start = new Date('2020-02-02T11:00');
				const end = new Date('2020-02-02T12:00');

				const bookingRequest = {
					citizenEmail: 'test@mail.com',
					citizenName: 'Jake',
					citizenUinFin: 'S6979208A',
				} as BookingRequestV1;

				BookingRepositoryMock.booking = new BookingBuilder()
					.withEventId(5)
					.withServiceId(1)
					.withStartDateTime(start)
					.withEndDateTime(end)
					.withAutoAccept(true)
					.withMarkOnHold(true)
					.withCitizenAuthType(CitizenAuthenticationType.Otp)
					.build();

				UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(otpMock));
				UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new OtpAuthGroup(otpMock)]));

				const result = await bookingService.validateOnHoldBooking(1, bookingRequest, true);

				expect(result.ownerId).toBe(otpMock.id);
			});

			it('should update owner id when citizen updates the booking (Singpass)', async () => {
				const bookingService = Container.get(BookingsService);
				const start = new Date('2020-02-02T11:00');
				const end = new Date('2020-02-02T12:00');

				const bookingRequest = {
					citizenEmail: 'test@mail.com',
					citizenName: 'Jake',
					citizenUinFin: 'S6979208A',
				} as BookingRequestV1;

				BookingRepositoryMock.booking = new BookingBuilder()
					.withEventId(5)
					.withServiceId(1)
					.withStartDateTime(start)
					.withEndDateTime(end)
					.withAutoAccept(true)
					.withMarkOnHold(true)
					.withCitizenAuthType(CitizenAuthenticationType.Singpass)
					.build();

				UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
				UserContextMock.getAuthGroups.mockImplementation(() =>
					Promise.resolve([new CitizenAuthGroup(singpassMock)]),
				);

				const result = await bookingService.validateOnHoldBooking(1, bookingRequest, true);

				expect(result.ownerId).toBe(singpassMock.id);
			});
		});
	});

	it('should be able to bypass captcha and make a booking as an agency, with no validationType specified - default citizen', async () => {
		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;
		customProvider.autoAcceptBookings = false;

		const bookingRequest: BookingRequestV1 = new BookingRequestV1();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;

		TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
			return Promise.resolve([
				{
					serviceProvider: customProvider,
					capacity: 1,
					acceptedBookings: [],
					pendingBookings: [],
					availabilityCount: 1,
				} as TimeslotServiceProviderResult,
			]);
		});

		ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(Promise.resolve(customProvider));
		ServiceProvidersRepositoryMock.getServiceProviderMock = customProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(agencyMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(agencyMock, [organisation])]),
		);

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.PendingApproval);
		expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
		expect(validatorMock.bypassCaptcha).toBeCalledWith(true);
	});

	it('should auto-accept booking when a booking is made directly via API, as an agency with validationType equals to admin', async () => {
		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;
		customProvider.autoAcceptBookings = false;

		const bookingRequest: BookingRequestV1 = new BookingRequestV1();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;
		bookingRequest.validationType = BookingValidationType.Admin;

		TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
			return Promise.resolve([
				{
					serviceProvider: customProvider,
					capacity: 1,
					acceptedBookings: [],
					pendingBookings: [],
					availabilityCount: 1,
				} as TimeslotServiceProviderResult,
			]);
		});

		ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(Promise.resolve(customProvider));
		ServiceProvidersRepositoryMock.getServiceProviderMock = customProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(agencyMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(agencyMock, [organisation])]),
		);

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.Accepted);
		expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
	});

	it('should fall back to service provider auto-accept configuration booking, as an agency when a booking is made directly via API with validationType equals to citizen', async () => {
		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;
		customProvider.autoAcceptBookings = false;

		const bookingRequest: BookingRequestV1 = new BookingRequestV1();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;
		bookingRequest.validationType = BookingValidationType.Citizen;

		TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
			return Promise.resolve([
				{
					serviceProvider: customProvider,
					capacity: 1,
					acceptedBookings: [],
					pendingBookings: [],
					availabilityCount: 1,
				} as TimeslotServiceProviderResult,
			]);
		});

		ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(Promise.resolve(customProvider));
		ServiceProvidersRepositoryMock.getServiceProviderMock = customProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(agencyMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(agencyMock, [organisation])]),
		);

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

		const bookingRequest: BookingRequestV1 = new BookingRequestV1();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;

		TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
			return Promise.resolve([
				{
					serviceProvider: customProvider,
					capacity: 1,
					acceptedBookings: [],
					pendingBookings: [],
					availabilityCount: 1,
				} as TimeslotServiceProviderResult,
			]);
		});

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

	it('should create onHold booking for citizen (when workflowType = OnHold)', async () => {
		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;
		customProvider.autoAcceptBookings = true;

		const bookingRequest: BookingRequestV1 = new BookingRequestV1();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;
		bookingRequest.workflowType = BookingWorkflowType.OnHold;

		TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
			return Promise.resolve([
				{
					serviceProvider: customProvider,
					capacity: 1,
					acceptedBookings: [],
					pendingBookings: [],
					availabilityCount: 1,
				} as TimeslotServiceProviderResult,
			]);
		});

		ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(Promise.resolve(customProvider));
		ServiceProvidersRepositoryMock.getServiceProviderMock = customProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(singpassMock)]));

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.OnHold);
		expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
	});

	it('should not auto accept booking for citizen (when sp flag = false)', async () => {
		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;
		customProvider.autoAcceptBookings = false;

		const bookingRequest: BookingRequestV1 = new BookingRequestV1();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;

		TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
			return Promise.resolve([
				{
					serviceProvider: customProvider,
					capacity: 1,
					acceptedBookings: [],
					pendingBookings: [],
					availabilityCount: 1,
				} as TimeslotServiceProviderResult,
			]);
		});

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

		const bookingRequest: BookingRequestV1 = new BookingRequestV1();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;

		TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
			return Promise.resolve([
				{
					serviceProvider: customProvider,
					capacity: 1,
					acceptedBookings: [],
					pendingBookings: [],
					availabilityCount: 1,
				} as TimeslotServiceProviderResult,
			]);
		});

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
		const bookingRequest: BookingRequestV1 = new BookingRequestV1();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 1;

		TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
			return Promise.resolve([
				{
					serviceProvider,
					capacity: 1,
					acceptedBookings: [],
					pendingBookings: [],
					availabilityCount: 1,
				} as TimeslotServiceProviderResult,
			]);
		});

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
		const bookingRequest: BookingRequestV1 = new BookingRequestV1();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 1;
		bookingRequest.refId = 'RFM186';
		bookingRequest.citizenUinFin = 'NRIC1234';

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		ServiceProvidersServiceMock.getServiceProviderMock.mockReturnValue(Promise.resolve(serviceProvider));

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
		const bookingRequest: BookingRequestV1 = new BookingRequestV1();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.citizenUinFin = 'NRIC1234';

		TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
			return Promise.resolve([
				{
					serviceProvider,
					capacity: 1,
					acceptedBookings: [],
					pendingBookings: [],
					availabilityCount: 1,
				} as TimeslotServiceProviderResult,
			]);
		});

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

		TimeslotsServiceMock.isProviderAvailableForTimeslot.mockReturnValue(Promise.resolve(true));
		TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
			return Promise.resolve([
				{
					serviceProvider,
					capacity: 1,
					acceptedBookings: [],
					pendingBookings: [],
					availabilityCount: 1,
				} as TimeslotServiceProviderResult,
			]);
		});

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		const acceptRequest = new BookingAcceptRequestV1();
		acceptRequest.serviceProviderId = 1;
		const result = await bookingService.acceptBooking(1, acceptRequest);

		expect(result.status).toBe(BookingStatus.Accepted);
	});

	it('should approve booking and change status to pending', async () => {
		const serviceProvider = ServiceProvider.create('provider', 1);
		serviceProvider.id = 1;
		serviceProvider.autoAcceptBookings = false;
		service.requireVerifyBySA = true;
		const bookingService = Container.get(BookingsService);
		BookingRepositoryMock.booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.withPendingSA(true)
			.build();

		TimeslotsServiceMock.isProviderAvailableForTimeslot.mockReturnValue(Promise.resolve(true));
		TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
			return Promise.resolve([
				{
					serviceProvider,
					capacity: 1,
					acceptedBookings: [],
					pendingBookings: [],
					availabilityCount: 1,
				} as TimeslotServiceProviderResult,
			]);
		});

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		const acceptRequest = new BookingAcceptRequestV1();
		acceptRequest.serviceProviderId = 1;
		const result = await bookingService.acceptBooking(1, acceptRequest);
		BookingRepositoryMock.booking.service = service;
		BookingRepositoryMock.booking.serviceProvider = serviceProvider;

		expect(result.status).toBe(BookingStatus.PendingApproval);
		expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledWith({
			booking: BookingRepositoryMock.booking,
			bookingType: BookingType.ApprovedBySA,
		});
	});

	it('should accept booking with pre selected service provider', async () => {
		const bookingService = Container.get(BookingsService);
		BookingRepositoryMock.booking = new BookingBuilder()
			.withServiceId(1)
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		BookingRepositoryMock.booking.serviceProviderId = 1;

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		const acceptRequest = new BookingAcceptRequestV1();
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

		TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
			return Promise.resolve([
				{
					serviceProvider,
					capacity: 1,
					acceptedBookings: [],
					pendingBookings: [],
					availabilityCount: 1,
				} as TimeslotServiceProviderResult,
			]);
		});

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

	it('should get booking by uuid as an anonymous user', async () => {
		const bookingService = Container.get(BookingsService);
		const bookingUUID = uuid.v4();
		const bookingMock = new BookingBuilder()
			.withServiceId(service.id)
			.withCitizenEmail('test@mail.com')
			.withStartDateTime(new Date('2020-02-02T11:00'))
			.withEndDateTime(new Date('2020-02-02T12:00'))
			.build();
		bookingMock.uuid = bookingUUID;
		bookingMock.id = 10;
		BookingRepositoryMock.getBookingByUUID.mockResolvedValue(bookingMock);

		const resultBooking = await bookingService.getBookingByUUID(bookingUUID);
		expect(resultBooking.uuid).toBe(bookingUUID);
		expect(resultBooking.id).toBe(10);
	});

	it('should throw an exception when booking not found by uuid as an anonymous user', async () => {
		const bookingService = Container.get(BookingsService);
		BookingRepositoryMock.getBookingByUUID.mockResolvedValue(null);

		const testBookingUUID = uuid.v4();
		await expect(async () => await bookingService.getBookingByUUID(testBookingUUID)).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Booking ' + testBookingUUID + ' not found'),
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
		} as BookingUpdateRequestV1;

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
		expect(bookingActionVisitorMock.hasPermission).toBeCalled();
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
		} as BookingUpdateRequestV1;

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

		const oneOffTimeslots = new OneOffTimeslot();
		oneOffTimeslots.id = 1;
		oneOffTimeslots.startDateTime = new Date('2020-10-01T01:00:00Z');
		oneOffTimeslots.endDateTime = new Date('2020-10-01T02:00:00Z');

		BookingRepositoryMock.booking = new BookingBuilder()
			.withServiceId(service.id)
			.withCitizenEmail('test@mail.com')
			.withSlots([[oneOffTimeslots]])
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

	it('should be able to bypass captcha as an agency when creating a new booking even if bypassCaptchaAndAutoAccept is equal to false', async () => {
		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;
		customProvider.autoAcceptBookings = false;

		const bookingRequest: BookingRequestV1 = new BookingRequestV1();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(agencyMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(agencyMock, [organisation])]),
		);

		await Container.get(BookingsService).save(bookingRequest, 1, false);
		expect(validatorMock.bypassCaptcha).toBeCalledWith(true);
	});

	it('should be able to bypass captcha when updating a booking as an agency', async () => {
		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;
		customProvider.autoAcceptBookings = false;

		const start = new Date('2020-02-02T11:00');
		const end = new Date('2020-02-02T12:00');
		BookingRepositoryMock.booking = new BookingBuilder()
			.withServiceId(1)
			.withCitizenEmail('test@mail.com')
			.withStartDateTime(start)
			.withEndDateTime(end)
			.build();

		const bookingRequest: BookingRequestV1 = new BookingRequestV1();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(agencyMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(agencyMock, [organisation])]),
		);

		await Container.get(BookingsService).update(1, bookingRequest);
		expect(validatorMock.bypassCaptcha).toBeCalledWith(true);
	});

	it('should be NOT able to bypass captcha as an anonymous user when creating a new booking', async () => {
		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;
		customProvider.autoAcceptBookings = false;

		const bookingRequest: BookingRequestV1 = new BookingRequestV1();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 200;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(anonymousMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new AnonymousAuthGroup(anonymousMock, undefined, { mobileNo: '+6584000000' })]),
		);

		await Container.get(BookingsService).save(bookingRequest, 1);

		expect(validatorMock.bypassCaptcha).toBeCalledWith(false);
	});

	it('should change booking user', async () => {
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(singpassMock)]));

		let booking = new Booking();
		booking.startDateTime = new Date('2020-02-02T11:00Z');
		booking.endDateTime = new Date('2020-02-02T12:00Z');
		booking.id = 2;
		booking.uuid = '70ea8f89-2b68-404c-bab9-43af02579f46';
		booking.creatorId = 3;
		booking.markOnHold();

		BookingRepositoryMock.getBookingByUUID.mockResolvedValue(booking);
		BookingRepositoryMock.update.mockImplementation(async (b) => {
			booking = b;
			return b;
		});

		const service = Container.get(BookingsService);
		const result = await service.changeUser({ bookingId: 2, bookingUUID: '70ea8f89-2b68-404c-bab9-43af02579f46' });

		expect(result).toBeDefined();
		expect(result.creatorId).toEqual(singpassMock.id);
		expect(result.citizenUinFin).toEqual(singpassMock._singPassUser.UinFin);
		expect(BookingChangeLogsServiceMock.executeAndLogAction).toBeCalled();
		expect(BookingChangeLogsServiceMock.action).toEqual(ChangeLogAction.UpdateUser);
	});

	it('should NOT change booking user when uuid matches but id does not', async () => {
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(singpassMock)]));

		let booking = new Booking();
		booking.startDateTime = new Date('2020-02-02T11:00Z');
		booking.endDateTime = new Date('2020-02-02T12:00Z');
		booking.id = 15;
		booking.uuid = '70ea8f89-2b68-404c-bab9-43af02579f46';
		booking.creatorId = 3;
		booking.markOnHold();

		BookingRepositoryMock.getBookingByUUID.mockResolvedValue(booking);
		BookingRepositoryMock.update.mockImplementation(async (b) => {
			booking = b;
			return b;
		});

		const service = Container.get(BookingsService);
		const testCase = async () =>
			await service.changeUser({
				bookingId: 2,
				bookingUUID: '70ea8f89-2b68-404c-bab9-43af02579f46',
			});

		await expect(testCase).rejects.toMatchInlineSnapshot('[SYS_NOT_FOUND (404): Booking 2 not found]');
	});

	it('should NOT change booking user when booking is not onHold', async () => {
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(singpassMock)]));

		let booking = new Booking();
		booking.startDateTime = new Date('2020-02-02T11:00Z');
		booking.endDateTime = new Date('2020-02-02T12:00Z');
		booking.id = 2;
		booking.uuid = '70ea8f89-2b68-404c-bab9-43af02579f46';
		booking.creatorId = 3;
		booking.status = BookingStatus.Accepted;

		BookingRepositoryMock.getBookingByUUID.mockResolvedValue(booking);
		BookingRepositoryMock.update.mockImplementation(async (b) => {
			booking = b;
			return b;
		});

		const service = Container.get(BookingsService);
		const testCase = async () =>
			await service.changeUser({
				bookingId: 2,
				bookingUUID: '70ea8f89-2b68-404c-bab9-43af02579f46',
			});

		await expect(testCase).rejects.toMatchInlineSnapshot(
			'[SYS_INVALID_PARAM (400): Booking 2 is in invalid state for user change.]',
		);
	});

	it('should NOT change booking user when booking is not found', async () => {
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(singpassMock)]));

		BookingRepositoryMock.getBookingByUUID.mockResolvedValue(null);

		const service = Container.get(BookingsService);
		const testCase = async () =>
			await service.changeUser({
				bookingId: 2,
				bookingUUID: '70ea8f89-2b68-404c-bab9-43af02579f46',
			});

		await expect(testCase).rejects.toMatchInlineSnapshot('[SYS_NOT_FOUND (404): Booking 2 not found]');
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
			} as BookingRequestV1;

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
			expect(bookingActionVisitorMock.hasPermission).toBeCalled();
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
			} as BookingRequestV1;

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

		it('should validate on hold event booking and change status to accepted', async () => {
			const bookingService = Container.get(BookingsService);
			const start = new Date('2020-02-02T11:00');
			const end = new Date('2020-02-02T12:00');

			const bookingRequest = {
				citizenEmail: 'test@mail.com',
				citizenName: 'Jake',
				citizenUinFin: 'S6979208A',
			} as BookingRequestV1;

			BookingRepositoryMock.booking = new BookingBuilder()
				.withEventId(5)
				.withServiceId(1)
				.withStartDateTime(start)
				.withEndDateTime(end)
				.withAutoAccept(true)
				.withMarkOnHold(true)
				.build();

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
			);

			const result = await bookingService.validateOnHoldBooking(1, bookingRequest, true);

			expect(result.status).toBe(BookingStatus.Accepted);
			expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
			expect(bookingActionVisitorMock.hasPermission).toBeCalled();
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
			} as BookingRequestV1;

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
			const bookingRequest: BookingRequestV1 = new BookingRequestV1();
			bookingRequest.startDateTime = new Date();
			bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
			bookingRequest.videoConferenceUrl = 'www.google.com';

			TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
				return Promise.resolve([
					{
						serviceProvider,
						capacity: 1,
						acceptedBookings: [],
						pendingBookings: [],
						availabilityCount: 1,
					} as TimeslotServiceProviderResult,
				]);
			});

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
			} as BookingUpdateRequestV1;

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
		service = new Service();
		service.id = 1;
		service.organisation = organisation;
		service.organisationId = organisation.id;
		service.citizenAuthentication = [CitizenAuthenticationType.Singpass, CitizenAuthenticationType.Otp];
		service.isOnHold = false;
		service.isStandAlone = false;

		it('should reschedule booking', async () => {
			const bookingService = Container.get(BookingsService);
			BookingRepositoryMock.booking = new BookingBuilder()
				.withServiceId(service.id)
				.withStartDateTime(new Date('2020-10-01T01:00:00'))
				.withEndDateTime(new Date('2020-10-01T02:00:00'))
				.withServiceProviderId(1)
				.build();
			BookingRepositoryMock.booking.service = service;

			const rescheduleRequest = {
				startDateTime: new Date('2020-10-01T05:00:00'),
				endDateTime: new Date('2020-10-01T06:00:00'),
			} as BookingRequestV1;

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);

			const result = await bookingService.reschedule(1, rescheduleRequest);
			expect(BookingChangeLogsServiceMock.action).toStrictEqual(ChangeLogAction.Reschedule);
			expect(result.status).toStrictEqual(BookingStatus.PendingApproval);
			expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
			expect(bookingActionVisitorMock.hasPermission).toBeCalled();
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
			} as BookingRequestV1;

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
			);

			await expect(async () => await bookingService.reschedule(1, rescheduleRequest)).rejects.toThrowError();
		});

		it('should set booking on hold when rescheduling booking and isStandAlone is true', async () => {
			const standAloneService = new Service();
			standAloneService.id = 1;
			standAloneService.organisation = organisation;
			standAloneService.organisationId = organisation.id;
			standAloneService.isStandAlone = true;
			standAloneService.citizenAuthentication = [CitizenAuthenticationType.Singpass];

			const bookingService = Container.get(BookingsService);
			BookingRepositoryMock.booking = new BookingBuilder()
				.withServiceId(standAloneService.id)
				.withStartDateTime(new Date('2020-10-01T01:00:00'))
				.withEndDateTime(new Date('2020-10-01T02:00:00'))
				.withServiceProviderId(1)
				.build();
			BookingRepositoryMock.booking.service = standAloneService;

			const rescheduleRequest = {
				startDateTime: new Date('2020-10-01T05:00:00'),
				endDateTime: new Date('2020-10-01T06:00:00'),
			} as BookingRequestV1;

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);
			ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(standAloneService));

			const result = await bookingService.reschedule(1, rescheduleRequest);
			// Create OnHold
			expect(BookingChangeLogsServiceMock.action).toStrictEqual(ChangeLogAction.Create);
			expect(result.status).toStrictEqual(BookingStatus.OnHold);
		});

		it('should set booking nric for on hold booking with existing nric when rescheduling and isStandAlone is true', async () => {
			const standAloneService = new Service();
			standAloneService.id = 1;
			standAloneService.organisation = organisation;
			standAloneService.organisationId = organisation.id;
			standAloneService.citizenAuthentication = [CitizenAuthenticationType.Otp];
			standAloneService.isStandAlone = true;

			const bookingRequest: BookingRequestV1 = new BookingRequestV1();
			bookingRequest.startDateTime = new Date('2020-10-01T01:00:00');
			bookingRequest.endDateTime = new Date('2020-10-01T02:00:00');
			bookingRequest.serviceProviderId = 1;
			bookingRequest.citizenName = 'test';
			bookingRequest.citizenEmail = 'test@mail.com';
			bookingRequest.citizenUinFin = 'ABC789';

			const rescheduleRequest = {
				citizenName: 'test',
				citizenEmail: 'test@mail.com',
				startDateTime: new Date('2020-10-01T05:00:00'),
				endDateTime: new Date('2020-10-01T06:00:00'),
			} as BookingRequestV1;

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(anonymousMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new AnonymousAuthGroup(anonymousMock, undefined, { mobileNo: '+6584000000' })]),
			);
			ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(standAloneService));

			await Container.get(BookingsService).save(bookingRequest, 1);

			const result = await Container.get(BookingsService).reschedule(1, rescheduleRequest);
			// Create OnHold
			expect(BookingChangeLogsServiceMock.action).toStrictEqual(ChangeLogAction.Create);
			expect(result.status).toStrictEqual(BookingStatus.OnHold);
			expect(result.citizenUinFin).toEqual('ABC789');
		});

		it('should set booking nric for on hold booking when citizenUinFinUpdated is true - rescheduling', async () => {
			const standAloneService = new Service();
			standAloneService.id = 1;
			standAloneService.organisation = organisation;
			standAloneService.organisationId = organisation.id;
			standAloneService.citizenAuthentication = [CitizenAuthenticationType.Otp];
			standAloneService.isStandAlone = true;

			const bookingRequest: BookingRequestV1 = new BookingRequestV1();
			bookingRequest.startDateTime = new Date('2020-10-01T01:00:00');
			bookingRequest.endDateTime = new Date('2020-10-01T02:00:00');
			bookingRequest.serviceProviderId = 1;
			bookingRequest.citizenName = 'test';
			bookingRequest.citizenEmail = 'test@mail.com';
			bookingRequest.citizenUinFin = 'ABC789';

			const rescheduleRequest = {
				citizenName: 'test',
				citizenEmail: 'test@mail.com',
				citizenUinFin: 'ASD123',
				startDateTime: new Date('2020-10-01T05:00:00'),
				endDateTime: new Date('2020-10-01T06:00:00'),
				citizenUinFinUpdated: true,
			} as BookingUpdateRequestV1;

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(anonymousMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new AnonymousAuthGroup(anonymousMock, undefined, { mobileNo: '+6584000000' })]),
			);
			ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(standAloneService));

			await Container.get(BookingsService).save(bookingRequest, 1);

			const result = await Container.get(BookingsService).reschedule(1, rescheduleRequest);
			// Create OnHold
			expect(BookingChangeLogsServiceMock.action).toStrictEqual(ChangeLogAction.Create);
			expect(result.status).toStrictEqual(BookingStatus.OnHold);
			expect(result.citizenUinFin).toEqual('ASD123');
		});
	});

	describe('On Hold', () => {
		const onHoldService = new Service();
		onHoldService.id = 2;
		onHoldService.isOnHold = true;
		onHoldService.citizenAuthentication = [CitizenAuthenticationType.Singpass];
		const onHoldServiceProvider = ServiceProvider.create('provider', 2);
		onHoldServiceProvider.id = 2;
		it('should mark booking as onhold and set the onhold current timestamp', async () => {
			const bookingRequest: BookingRequestV1 = new BookingRequestV1();
			bookingRequest.startDateTime = new Date();
			bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
			bookingRequest.serviceProviderId = 2;

			TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
				return Promise.resolve([
					{
						serviceProvider: onHoldServiceProvider,
						capacity: 1,
						acceptedBookings: [],
						pendingBookings: [],
						availabilityCount: 1,
					} as TimeslotServiceProviderResult,
				]);
			});

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
		standAloneService.citizenAuthentication = [CitizenAuthenticationType.Singpass];
		const standAloneServiceProvider = ServiceProvider.create('provider', 10);
		standAloneServiceProvider.id = 1;
		it('Should make an on hold booking if isStandAlone is set to true on service', async () => {
			standAloneService.isStandAlone = true;
			standAloneService.isOnHold = false;

			const bookingRequest: BookingRequestV1 = new BookingRequestV1();
			bookingRequest.startDateTime = new Date();
			bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
			bookingRequest.serviceProviderId = 1;

			TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
				return Promise.resolve([
					{
						serviceProvider: standAloneServiceProvider,
						capacity: 1,
						acceptedBookings: [],
						pendingBookings: [],
						availabilityCount: 1,
					} as TimeslotServiceProviderResult,
				]);
			});

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

			const bookingRequest: BookingRequestV1 = new BookingRequestV1();
			bookingRequest.startDateTime = new Date();
			bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
			bookingRequest.serviceProviderId = 1;

			TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => {
				return Promise.resolve([
					{
						serviceProvider: standAloneServiceProvider,
						capacity: 1,
						acceptedBookings: [],
						pendingBookings: [],
						availabilityCount: 1,
					} as TimeslotServiceProviderResult,
				]);
			});

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
		spAutoAssignedService.citizenAuthentication = [CitizenAuthenticationType.Singpass];
		spAutoAssignedService.id = 10;
		spAutoAssignedService.setIsSpAutoAssigned(true);

		const customProvider = ServiceProvider.create('provider', 1);
		customProvider.id = 200;

		let bookingRequest: BookingRequestV1;

		beforeEach(() => {
			ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(spAutoAssignedService));
			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);
			bookingRequest = new BookingRequestV1();
			bookingRequest.startDateTime = new Date();
			bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
			(randomIndex as jest.Mock).mockReturnValue(0);
		});

		it('should select random SP', async () => {
			ServiceProvidersServiceMock.getAvailableServiceProvidersMock.mockReturnValue(
				Promise.resolve([customProvider]),
			);

			await Container.get(BookingsService).save(bookingRequest, 10);

			expect(ServiceProvidersServiceMock.getAvailableServiceProvidersMock).toBeCalledWith(
				bookingRequest.startDateTime,
				bookingRequest.endDateTime,
				true,
				10,
			);
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

	describe('Event booking', () => {
		const mockEvent = new Event();

		beforeEach(() => {
			mockEvent.serviceId = service.id;
			mockEvent.title = 'Mock Event';
			mockEvent.id = 10;

			const slot1 = new OneOffTimeslot();
			slot1.eventId = 10;
			slot1.startDateTime = new Date();
			slot1.endDateTime = DateHelper.addMinutes(slot1.startDateTime, 45);
			slot1.serviceProviderId = 90;
			slot1.id = 1;

			const slot2 = new OneOffTimeslot();
			slot2.eventId = 10;
			slot2.startDateTime = DateHelper.addMinutes(slot1.startDateTime, 60);
			slot2.endDateTime = DateHelper.addMinutes(slot2.startDateTime, 45);
			slot2.serviceProviderId = 91;
			slot2.id = 2;
			mockEvent.oneOffTimeslots = [slot1, slot2];

			EventsServiceMock.getById.mockImplementation(() => Promise.resolve(mockEvent));
		});

		it('should be able to book an event as a citizen', async () => {
			const eventBookingRequest: EventBookingRequest = new EventBookingRequest();
			eventBookingRequest.citizenName = 'this should be the name';
			eventBookingRequest.citizenEmail = 'correctemail@gmail.com';
			eventBookingRequest.citizenPhone = '93328223';

			service.isStandAlone = false;
			service.isOnHold = false;
			ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(service));
			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);

			await Container.get(BookingsService).bookAnEvent(eventBookingRequest, 10);

			const booking = BookingRepositoryMock.booking;
			expect(booking).not.toBe(undefined);
			expect(booking.eventId).not.toBe(undefined || null);
			expect(booking.status).toBe(BookingStatus.Accepted);
			expect(booking.citizenName).toBe('this should be the name');
			expect(booking.citizenEmail).toBe('correctemail@gmail.com');
			expect(booking.citizenPhone).toBe('93328223');
			const bookedSlots = mockEvent.oneOffTimeslots.map((slot) => {
				const bookedSlot = new BookedSlot();
				bookedSlot.oneOffTimeslot = slot;
				bookedSlot.oneOffTimeslotId = slot.id;
				return bookedSlot;
			});
			expect(booking.bookedSlots).toStrictEqual(bookedSlots);
		});

		it('should be able to book an event as a citizen with standalone enabled', async () => {
			const eventBookingRequest: EventBookingRequest = new EventBookingRequest();
			eventBookingRequest.citizenName = 'this should be the name';
			eventBookingRequest.citizenEmail = 'correctemail@gmail.com';
			eventBookingRequest.citizenPhone = '93328223';

			const standaloneService = new Service();
			standaloneService.id = 1;
			standaloneService.citizenAuthentication = [CitizenAuthenticationType.Singpass];
			standaloneService.isStandAlone = true;
			mockEvent.serviceId = standaloneService.id;

			ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(standaloneService));
			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);

			await Container.get(BookingsService).bookAnEvent(eventBookingRequest, 10);

			const booking = BookingRepositoryMock.booking;
			expect(booking).not.toBe(undefined);
			expect(booking.eventId).not.toBe(undefined || null);
			expect(booking.status).toBe(BookingStatus.OnHold);
			expect(booking.citizenName).toBe('this should be the name');
			expect(booking.citizenEmail).toBe('correctemail@gmail.com');
			expect(booking.citizenPhone).toBe('93328223');
			const bookedSlots = mockEvent.oneOffTimeslots.map((slot) => {
				const bookedSlot = new BookedSlot();
				bookedSlot.oneOffTimeslot = slot;
				bookedSlot.oneOffTimeslotId = slot.id;
				return bookedSlot;
			});
			expect(booking.bookedSlots).toStrictEqual(bookedSlots);
		});

		it('should be able to book an event as an anonymous user', async () => {
			const eventBookingRequest: EventBookingRequest = new EventBookingRequest();
			eventBookingRequest.citizenName = 'this should be the name';
			eventBookingRequest.citizenEmail = 'correctemail@gmail.com';
			eventBookingRequest.citizenPhone = '93328223';

			const anonymousService = new Service();
			anonymousService.id = 1;
			anonymousService.citizenAuthentication = [CitizenAuthenticationType.Otp];
			anonymousService.isStandAlone = false;
			mockEvent.serviceId = anonymousService.id;

			ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(anonymousService));
			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(anonymousMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new AnonymousAuthGroup(anonymousMock, undefined, { mobileNo: '+6584000000' })]),
			);

			await Container.get(BookingsService).bookAnEvent(eventBookingRequest, 10);

			const booking = BookingRepositoryMock.booking;
			expect(booking).not.toBe(undefined);
			expect(booking.eventId).not.toBe(undefined || null);
			expect(booking.status).toBe(BookingStatus.Accepted);
			expect(booking.citizenName).toBe('this should be the name');
			expect(booking.citizenEmail).toBe('correctemail@gmail.com');
			expect(booking.citizenPhone).toBe('93328223');
			const bookedSlots = mockEvent.oneOffTimeslots.map((slot) => {
				const bookedSlot = new BookedSlot();
				bookedSlot.oneOffTimeslot = slot;
				bookedSlot.oneOffTimeslotId = slot.id;
				return bookedSlot;
			});
			expect(booking.bookedSlots).toStrictEqual(bookedSlots);
		});

		it('should be able to book an event as an org admin', async () => {
			const eventBookingRequest: EventBookingRequest = new EventBookingRequest();
			eventBookingRequest.citizenName = 'this should be the name';
			eventBookingRequest.citizenEmail = 'correctemail@gmail.com';
			eventBookingRequest.citizenPhone = '93328223';

			ServicesServiceMock.getService.mockImplementation(() => Promise.resolve(service));
			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(agencyMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new OrganisationAdminAuthGroup(agencyMock, [organisation])]),
			);

			await Container.get(BookingsService).bookAnEvent(eventBookingRequest, 10);

			const booking = BookingRepositoryMock.booking;
			expect(booking).not.toBe(undefined);
			expect(booking.eventId).not.toBe(undefined || null);
			expect(booking.status).toBe(BookingStatus.Accepted);
			expect(booking.citizenName).toBe('this should be the name');
			expect(booking.citizenEmail).toBe('correctemail@gmail.com');
			expect(booking.citizenPhone).toBe('93328223');
			const bookedSlots = mockEvent.oneOffTimeslots.map((slot) => {
				const bookedSlot = new BookedSlot();
				bookedSlot.oneOffTimeslot = slot;
				bookedSlot.oneOffTimeslotId = slot.id;
				return bookedSlot;
			});
			expect(booking.bookedSlots).toStrictEqual(bookedSlots);
		});
	});

	describe('2 step pending workflow (Singpass)', () => {
		it('should validate on hold booking and change status to pending SA if verifyBySA flag is set', async () => {
			const bookingService = Container.get(BookingsService);
			const start = new Date('2020-02-02T11:00');
			const end = new Date('2020-02-02T12:00');

			const bookingRequest = {
				citizenEmail: 'test@mail.com',
				citizenName: 'Jake',
				citizenUinFin: 'S6979208A',
			} as BookingRequestV1;
			service.requireVerifyBySA = true;

			BookingRepositoryMock.booking = new BookingBuilder()
				.withServiceId(1)
				.withStartDateTime(start)
				.withEndDateTime(end)
				.withAutoAccept(true)
				.withMarkOnHold(true)
				.build();

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);

			const result = await bookingService.validateOnHoldBooking(1, bookingRequest, false);

			expect(result.status).toBe(BookingStatus.PendingApprovalSA);
			expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
			expect(bookingActionVisitorMock.hasPermission).toBeCalled();
		});

		it('should save booking and change status to pending SA if verifyBySA flag is set', async () => {
			const bookingService = Container.get(BookingsService);
			const start = new Date('2020-02-02T11:00');
			const end = new Date('2020-02-02T12:00');

			const bookingRequest = {
				citizenEmail: 'test@mail.com',
				citizenName: 'Jake',
				citizenUinFin: 'S6979208A',
			} as BookingRequestV1;
			service.requireVerifyBySA = true;

			BookingRepositoryMock.booking = new BookingBuilder()
				.withServiceId(1)
				.withStartDateTime(start)
				.withEndDateTime(end)
				.withAutoAccept(true)
				.withMarkOnHold(false)
				.build();

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new CitizenAuthGroup(singpassMock)]),
			);

			const result = await bookingService.save(bookingRequest, 1);

			expect(result.status).toBe(BookingStatus.PendingApprovalSA);
			expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
			expect(bookingActionVisitorMock.hasPermission).toBeCalled();
		});
	});

	describe('2 step pending workflow (Anonymous)', () => {
		it('should validate on hold booking and change status to pending SA if verifyBySA flag is set', async () => {
			const bookingService = Container.get(BookingsService);
			const start = new Date('2020-02-02T11:00');
			const end = new Date('2020-02-02T12:00');

			const bookingRequest = {
				citizenEmail: 'test@mail.com',
				citizenName: 'Jake',
				citizenUinFin: 'S6979208A',
			} as BookingRequestV1;
			service.requireVerifyBySA = true;

			BookingRepositoryMock.booking = new BookingBuilder()
				.withServiceId(1)
				.withStartDateTime(start)
				.withEndDateTime(end)
				.withAutoAccept(true)
				.withMarkOnHold(true)
				.build();

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(anonymousMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new AnonymousAuthGroup(anonymousMock, undefined, { mobileNo: '+6584000000' })]),
			);

			const result = await bookingService.validateOnHoldBooking(1, bookingRequest, false);

			expect(result.status).toBe(BookingStatus.PendingApprovalSA);
			expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
			expect(bookingActionVisitorMock.hasPermission).toBeCalled();
		});

		it('should save booking and change status to pending SA if verifyBySA flag is set', async () => {
			const bookingService = Container.get(BookingsService);
			const start = new Date('2020-02-02T11:00');
			const end = new Date('2020-02-02T12:00');

			const bookingRequest = {
				citizenEmail: 'test@mail.com',
				citizenName: 'Jake',
				citizenUinFin: 'S6979208A',
			} as BookingRequestV1;
			service.requireVerifyBySA = true;

			BookingRepositoryMock.booking = new BookingBuilder()
				.withServiceId(1)
				.withStartDateTime(start)
				.withEndDateTime(end)
				.withAutoAccept(true)
				.withMarkOnHold(false)
				.build();

			UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(anonymousMock));
			UserContextMock.getAuthGroups.mockImplementation(() =>
				Promise.resolve([new AnonymousAuthGroup(anonymousMock, undefined, { mobileNo: '+6584000000' })]),
			);

			const result = await bookingService.save(bookingRequest, 1);

			expect(result.status).toBe(BookingStatus.PendingApprovalSA);
			expect(BookingsSubjectMock.notifyMock).toHaveBeenCalledTimes(1);
			expect(bookingActionVisitorMock.hasPermission).toBeCalled();
		});
	});
});
