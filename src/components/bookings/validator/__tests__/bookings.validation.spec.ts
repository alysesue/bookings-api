import { DateHelper } from '../../../../infrastructure/dateHelper';
import { Container } from 'typescript-ioc';
import { BookingsRepository } from '../../bookings.repository';
import { Organisation, ServiceProvider } from '../../../../models/entities';
import { TimeslotsService } from '../../../timeslots/timeslots.service';
import { ServiceProvidersRepository } from '../../../serviceProviders/serviceProviders.repository';
import { UnavailabilitiesService } from '../../../unavailabilities/unavailabilities.service';
import { UserContext } from '../../../../infrastructure/auth/userContext';
import { Booking, BookingBuilder } from '../../../../models/entities/booking';
import { BusinessValidation, Service, User } from '../../../../models';
import { BookingsValidatorFactory } from '../bookings.validation';
import {
	BookingRepositoryMock,
	TimeslotsServiceMock,
	UnavailabilitiesServiceMock,
} from '../../__mocks__/bookings.mocks';
import { TimeslotWithCapacity } from '../../../../models/timeslotWithCapacity';
import { AvailableTimeslotProviders } from '../../../../components/timeslots/availableTimeslotProviders';
import { CaptchaService } from '../../../captcha/captcha.service';
import { UserContextMock } from '../../../../infrastructure/auth/__mocks__/userContext';
import { getConfig } from '../../../../config/app-config';
import { IPagedEntities } from '../../../../core/pagedEntities';
import { ContainerContext, ContainerContextHolder } from '../../../../infrastructure/containerContext';
import { ServiceProvidersLookup } from '../../../../components/timeslots/aggregatorTimeslotProviders';
import { TimeslotServiceProviderResult } from '../../../../models/timeslotServiceProvider';
import { ServiceProvidersRepositoryMock } from '../../../../components/serviceProviders/__mocks__/serviceProviders.repository.mock';
import { CaptchaServiceMock } from '../../../../components/captcha/__mocks__/captcha.service.mock';

const createTimeslotNative = (startTime: number, endTime: number, capacity?: number) => {
	return {
		startTimeNative: startTime,
		endTimeNative: endTime,
		capacity: capacity || 1,
	} as TimeslotWithCapacity;
};

jest.mock('../../../captcha/captcha.service');
jest.mock('../../../../config/app-config', () => ({
	getConfig: jest.fn(),
}));

beforeAll(() => {
	ContainerContextHolder.registerInContainer();
});

// tslint:disable-next-line:no-big-function
describe('Booking validation tests', () => {
	let service: Service;
	let serviceProvider: ServiceProvider;
	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	beforeAll(() => {
		Container.bind(BookingsRepository).to(BookingRepositoryMock);
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(UnavailabilitiesService).to(UnavailabilitiesServiceMock);
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(CaptchaService).to(CaptchaServiceMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		service = Service.create('svc', new Organisation());
		service.id = 1;
		service.setNoNric(false);

		serviceProvider = ServiceProvider.create('provider', 1);
		serviceProvider.id = 1;
		ServiceProvidersRepositoryMock.getServiceProviderMock = undefined;

		CaptchaServiceMock.verify.mockReturnValue(Promise.resolve(true));
		(getConfig as jest.Mock).mockReturnValue({
			isAutomatedTest: false,
		});

		BookingRepositoryMock.searchBookings.mockImplementation(() =>
			Promise.resolve({ entries: [] } as IPagedEntities<Booking>),
		);

		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => Promise.resolve([]));
		TimeslotsServiceMock.getAvailableProvidersForTimeslot.mockImplementation(() => Promise.resolve([]));
		TimeslotsServiceMock.isProviderAvailableForTimeslot.mockImplementation(() => Promise.resolve(false));
	});

	it('should get same factory instance in Request scope', () => {
		const context = Container.get(ContainerContext);
		const getFactory = () => context.resolve(BookingsValidatorFactory);

		expect(getFactory() === getFactory()).toBe(true);
	});

	it('should get new instances for validators in Request scope', () => {
		const context = Container.get(ContainerContext);
		const factory = context.resolve(BookingsValidatorFactory);

		expect(factory.getValidator(true) === factory.getValidator(true)).toBe(false);
		expect(factory.getValidator(false) === factory.getValidator(false)).toBe(false);
		expect(factory.getOnHoldValidator() === factory.getOnHoldValidator()).toBe(false);
	});

	it('should return regular booking validator', () => {
		expect(Container.get(BookingsValidatorFactory).getValidator(false).constructor.name).toBe(
			'CitizenBookingValidator',
		);
	});

	it('should return out of slot booking validator', () => {
		expect(Container.get(BookingsValidatorFactory).getValidator(true).constructor.name).toBe(
			'AdminBookingValidator',
		);
	});

	it('should not allow booking out of timeslots due to unavailability', async () => {
		const start = new Date(2050, 8, 26, 8, 0);
		const end = DateHelper.addMinutes(start, 45);
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(end)
			.withServiceProviderId(1)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(service.id)
			.build();
		booking.service = service;

		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			entry.startTime = new Date(2050, 8, 26, 8, 0).getTime();
			entry.endTime = new Date(2050, 8, 26, 8, 45).getTime();

			entry.addServiceProvider(serviceProvider, createTimeslotNative(entry.startTime, entry.endTime, 1));

			return Promise.resolve([entry]);
		});

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		UnavailabilitiesServiceMock.isUnavailable.mockReturnValue(true);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		const test = async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking);
		await expect(test).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10001] The service provider is not available in the selected time range]',
		);

		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: start,
			endDateTime: end,
			filterDaysInAdvance: false, // false for admin validator
			includeBookings: true,
			serviceId: 1,
			serviceProviderIds: [1],
		});
	});

	it('should not allow booking out of timeslots due to expiryDate', async () => {
		const start = new Date(2030, 8, 26, 8, 0);
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 45))
			.withServiceProviderId(1)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(service.id)
			.build();
		booking.service = service;

		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			entry.startTime = new Date(2020, 8, 26, 8, 0).getTime();
			entry.endTime = new Date(2020, 8, 26, 8, 45).getTime();

			entry.addServiceProvider(serviceProvider, createTimeslotNative(entry.startTime, entry.endTime, 1));

			return Promise.resolve([entry]);
		});

		serviceProvider.expiryDate = new Date();
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		UnavailabilitiesServiceMock.isUnavailable.mockReturnValue(false);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		const test = async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking);
		await expect(test).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10013] Licence of service provider will be expired]',
		);
	});

	it('should validate citizen name', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withCitizenUinFin('G3382058K')
			.withCitizenEmail('email@gmail.com')
			.withServiceProviderId(1)
			.withServiceId(service.id)
			.build();
		booking.service = service;

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking),
		).rejects.toMatchInlineSnapshot('[BusinessError: [10006] Citizen name not provided]');
	});

	it('should validate citizen name error', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withCitizenName('@#$%^&')
			.withCitizenUinFin('G3382058K')
			.withCitizenEmail('email@gmail.com')
			.withServiceProviderId(1)
			.build();

		booking.service = {
			noNric: false,
		} as Service;

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking),
		).rejects.toMatchInlineSnapshot('[BusinessError: [10015] Citizen name is not valid]');
	});

	it('should append custom validations to citizen validation', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withCitizenUinFin('G3382058K')
			.withCitizenEmail('email@gmail.com')
			.withServiceProviderId(1)
			.withServiceId(service.id)
			.build();
		booking.service = service;

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		const validator = Container.get(BookingsValidatorFactory).getValidator(true);
		validator.addCustomCitizenValidations(new BusinessValidation({ code: 'abc', message: 'new validation' }));

		const asyncTest = async () => await validator.validate(booking);

		await expect(asyncTest).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10006] Citizen name not provided, [abc] new validation]',
		);
	});

	it('should validate token', async () => {
		CaptchaServiceMock.verify.mockReturnValue(Promise.resolve(false));
		const booking = new BookingBuilder()
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.withCitizenName('Andy')
			.withCitizenUinFin('G3382058K')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(service.id)
			.build();
		booking.service = service;

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
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toMatchInlineSnapshot('[BusinessError: [10011] Invalid captcha token]');
	});

	it('should concatenate validations', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withServiceProviderId(1)
			.withServiceId(service.id)
			.build();
		booking.service = service;

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking),
		).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10005] Citizen UIN/FIN not found, [10006] Citizen name not provided, [10007] Citizen email not provided]',
		);
	});

	it('should validate service provider (required) for out of slot booking', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(service.id)
			.build();
		booking.service = service;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking),
		).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10010] Service provider is required for out of slot bookings]',
		);
	});

	it('should NOT validate service provider for out of slot booking (on hold)', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(service.id)
			.build();
		booking.service = service;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		await Container.get(BookingsValidatorFactory).getOnHoldValidator().validate(booking);
	});

	it('should validate service provider (not found) for out of slot booking', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceProviderId(5)
			.withServiceId(service.id)
			.build();
		booking.service = service;

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking),
		).rejects.toMatchInlineSnapshot(`[BusinessError: [10009] Service provider '5' not found]`);
	});

	it('should validate citizen email (required)', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withServiceProviderId(1)
			.withServiceId(service.id)
			.build();
		booking.service = service;

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking),
		).rejects.toMatchInlineSnapshot('[BusinessError: [10007] Citizen email not provided]');
	});

	it('should validate invalid citizen email', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmailcom')
			.withServiceProviderId(1)
			.withServiceId(service.id)
			.build();
		booking.service = service;

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking),
		).rejects.toMatchInlineSnapshot('[BusinessError: [10008] Citizen email not valid]');
	});

	it('should validate end date time', async () => {
		const booking = new BookingBuilder()
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.withServiceId(service.id)
			.build();
		booking.service = service;

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

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toThrowError();
	});

	it('should validate end time not earlier than start time', async () => {
		const booking = new BookingBuilder()
			.withStartDateTime(new Date('2050-10-01T01:00:00'))
			.withEndDateTime(new Date('2050-10-01T00:00:00'))
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(service.id)
			.build();
		booking.service = service;

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

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10004] End time for booking must be greater than start time]',
		);
	});

	it('should throw on validation error', async () => {
		const booking = new BookingBuilder()
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.withServiceId(service.id)
			.build();
		booking.service = service;

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

		const asyncTest = async () =>
			await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking);
		await expect(asyncTest).rejects.toThrowError();
	});

	it('should validate available service providers', async () => {
		const start = new Date();
		const end = DateHelper.addMinutes(start, 60);
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(end)
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(service.id)
			.build();
		booking.service = service;

		BookingRepositoryMock.searchBookings.mockImplementation(() =>
			Promise.resolve({
				entries: [
					new BookingBuilder()
						.withServiceId(1)
						.withStartDateTime(new Date('2020-10-01T01:00:00'))
						.withEndDateTime(new Date('2020-10-01T02:00:00'))
						.build(),
				],
			} as IPagedEntities<Booking>),
		);

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10002] No available service providers in the selected time range]',
		);

		expect(TimeslotsServiceMock.getAvailableProvidersForTimeslot).toBeCalledWith({
			startDateTime: start,
			endDateTime: end,
			filterDaysInAdvance: true, // true for citizen validator
			serviceId: 1,
			skipUnassigned: false,
		});
	});

	it('should validate single available service provider', async () => {
		const start = new Date();
		const end = DateHelper.addMinutes(start, 60);
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(end)
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(service.id)
			.withServiceProviderId(1)
			.build();
		booking.service = service;

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		BookingRepositoryMock.searchBookings.mockImplementation(() =>
			Promise.resolve({
				entries: [
					new BookingBuilder()
						.withServiceId(1)
						.withStartDateTime(new Date('2020-10-01T01:00:00'))
						.withEndDateTime(new Date('2020-10-01T02:00:00'))
						.build(),
				],
			} as IPagedEntities<Booking>),
		);

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10001] The service provider is not available in the selected time range]',
		);

		expect(TimeslotsServiceMock.isProviderAvailableForTimeslot).toBeCalledWith({
			startDateTime: start,
			endDateTime: end,
			filterDaysInAdvance: true, // true for citizen validator
			serviceId: 1,
			serviceProviderId: 1,
			skipUnassigned: false,
		});
	});

	it('should validate availability for direct booking', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceProviderId(1)
			.withServiceId(service.id)
			.build();
		booking.service = service;

		BookingRepositoryMock.searchBookings.mockImplementation(() =>
			Promise.resolve({
				entries: [
					new BookingBuilder()
						.withServiceId(1)
						.withStartDateTime(new Date('2020-10-01T01:00:00'))
						.withEndDateTime(new Date('2020-10-01T02:00:00'))
						.build(),
				],
			} as IPagedEntities<Booking>),
		);

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10001] The service provider is not available in the selected time range]',
		);
	});

	it('should validate no citizenUinFin', async () => {
		const booking = new BookingBuilder()
			.withStartDateTime(new Date('2050-10-01T01:00:00'))
			.withEndDateTime(new Date('2050-10-01T02:00:00'))
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceProviderId(1)
			.withServiceId(service.id)
			.build();
		booking.service = service;

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

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

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(null));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toMatchInlineSnapshot('[BusinessError: [10005] Citizen UIN/FIN not found]');
	});

	it('should not allow booking on top of existing booking', async () => {
		const start = new Date(2050, 8, 26, 8, 0);
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withServiceProviderId(1)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(service.id)
			.build();
		booking.service = service;

		BookingRepositoryMock.searchBookings.mockImplementation(() =>
			Promise.resolve({
				entries: [
					new BookingBuilder()
						.withServiceId(1)
						.withStartDateTime(new Date(2050, 8, 26, 8, 15))
						.withEndDateTime(new Date(2050, 8, 26, 8, 45))
						.build(),
				],
			} as IPagedEntities<Booking>),
		);
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			entry.startTime = new Date(2050, 8, 26, 8, 0).getTime();
			entry.endTime = new Date(2050, 8, 26, 8, 45).getTime();

			entry.addServiceProvider(serviceProvider, createTimeslotNative(entry.startTime, entry.endTime, 1));

			return Promise.resolve([entry]);
		});

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		const test = async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking);
		await expect(test).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10003] Booking request not valid as it overlaps another accepted booking]',
		);
	});

	it('should allow updating booking to out of slot', async () => {
		const booking = new BookingBuilder()
			.withStartDateTime(new Date(2050, 8, 26, 8, 15))
			.withEndDateTime(new Date(2050, 8, 26, 8, 45))
			.withServiceProviderId(1)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(service.id)
			.build();
		booking.service = service;
		booking.id = 5;

		const searchBooking = new BookingBuilder()
			.withStartDateTime(new Date(2050, 8, 26, 7, 15))
			.withEndDateTime(new Date(2050, 8, 26, 7, 45))
			.withServiceProviderId(1)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(service.id)
			.build();
		searchBooking.service = service;
		searchBooking.id = 5;

		BookingRepositoryMock.searchBookings.mockImplementation(() =>
			Promise.resolve({ entries: [searchBooking] } as IPagedEntities<Booking>),
		);

		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			entry.startTime = new Date(2050, 8, 26, 7, 15).getTime();
			entry.endTime = new Date(2050, 8, 26, 7, 45).getTime();

			entry.addServiceProvider(serviceProvider, createTimeslotNative(entry.startTime, entry.endTime, 1));

			return Promise.resolve([entry]);
		});

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking);
	});

	it('should not allow booking on top of existing on hold booking until previous booking is expired', async () => {
		const onHoldService = new Service();
		onHoldService.id = 2;
		onHoldService.isOnHold = true;
		const onHoldServiceProvider = ServiceProvider.create('provider', 2);
		onHoldServiceProvider.id = 2;

		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withServiceProviderId(2)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withMarkOnHold(true)
			.withServiceId(service.id)
			.build();
		booking.service = service;
		booking.service = onHoldService;

		BookingRepositoryMock.searchBookings.mockImplementation(() =>
			Promise.resolve({
				entries: [
					new BookingBuilder()
						.withServiceId(2)
						.withStartDateTime(DateHelper.addMinutes(start, 15))
						.withEndDateTime(DateHelper.addMinutes(start, 45))
						.withMarkOnHold(true)
						.build(),
				],
			} as IPagedEntities<Booking>),
		);

		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			entry.startTime = DateHelper.addMinutes(start, 15).getTime();
			entry.endTime = DateHelper.addMinutes(start, 45).getTime();

			entry.addServiceProvider(serviceProvider, createTimeslotNative(entry.startTime, entry.endTime, 1));

			return Promise.resolve([entry]);
		});

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		const test = async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking);
		await expect(test).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10003] Booking request not valid as it overlaps another accepted booking]',
		);
	});

	it('should allow a new booking with a valid video conference url', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceProviderId(1)
			.withVideoConferenceUrl('https://www.videoConference.com/details')
			.withServiceId(service.id)
			.build();
		booking.service = service;
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking);
	});

	it('should validate invalid video conference url in a new booking', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceProviderId(1)
			.withVideoConferenceUrl('video conference url hardcoded input')
			.withServiceId(service.id)
			.build();
		booking.service = service;
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking),
		).rejects.toMatchInlineSnapshot('[BusinessError: [10014] Invalid video conference link is provided]');
	});

	it('should validate null NRIC when noNRIC is true', async () => {
		service.setNoNric(true);

		const booking = new BookingBuilder()
			.withStartDateTime(new Date('2051-10-01T01:00:00'))
			.withEndDateTime(new Date('2051-10-01T02:00:00'))
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceProviderId(1)
			.withCitizenUinFin(null)
			.withServiceId(service.id)
			.build();
		booking.service = service;

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

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

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(null));

		await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking);
	});
	it('should validate valid NRIC when noNRIC is true', async () => {
		service.setNoNric(true);

		const booking = new BookingBuilder()
			.withStartDateTime(new Date('2051-10-01T01:00:00'))
			.withEndDateTime(new Date('2051-10-01T02:00:00'))
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceProviderId(1)
			.withCitizenUinFin('G3382058K')
			.withServiceId(service.id)
			.build();
		booking.service = service;

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

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

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(null));

		await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking);
	});
	it('It should validate NRIC when present when noNRIC is true', async () => {
		service.setNoNric(true);

		const booking = new BookingBuilder()
			.withStartDateTime(new Date('2051-10-01T01:00:00'))
			.withEndDateTime(new Date('2051-10-01T02:00:00'))
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceProviderId(1)
			.withCitizenUinFin('abcde')
			.withServiceId(service.id)
			.build();
		booking.service = service;

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

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

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(null));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking),
		).rejects.toMatchInlineSnapshot('[BusinessError: [10005] Citizen UIN/FIN not found]');
	});
});
