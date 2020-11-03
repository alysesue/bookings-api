import { DateHelper } from '../../../../infrastructure/dateHelper';
import { Container } from 'typescript-ioc';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { BookingsRepository } from '../../bookings.repository';
import { ServiceProvider } from '../../../../models/entities';
import { TimeslotsService } from '../../../timeslots/timeslots.service';
import { ServiceProvidersRepository } from '../../../serviceProviders/serviceProviders.repository';
import { UnavailabilitiesService } from '../../../unavailabilities/unavailabilities.service';
import { UserContext } from '../../../../infrastructure/auth/userContext';
import { BookingBuilder } from '../../../../models/entities/booking';
import { BusinessValidation, User } from '../../../../models';
import { BookingsValidatorFactory } from '../bookings.validation';
import {
	BookingRepositoryMock,
	ServiceProvidersRepositoryMock,
	TimeslotsServiceMock,
	UnavailabilitiesServiceMock,
	UserContextMock,
} from '../../__tests__/bookings.mocks';
import { TimeslotWithCapacity } from '../../../../models/timeslotWithCapacity';
import { AvailableTimeslotProviders } from '../../../../components/timeslots/availableTimeslotProviders';
import { BusinessError } from '../../../../errors/businessError';

// tslint:disable-next-line:no-big-function
describe('Booking validation tests', () => {
	const serviceProvider = ServiceProvider.create('provider', 1);
	serviceProvider.id = 1;
	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

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

	beforeAll(() => {
		Container.bind(BookingsRepository).to(BookingRepositoryMock);
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(UnavailabilitiesService).to(UnavailabilitiesServiceMock);
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		Container.bind(UserContext).to(UserContextMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		ServiceProvidersRepositoryMock.getServiceProviderMock = undefined;
	});

	it('should return regular booking validator', () => {
		expect(Container.get(BookingsValidatorFactory).getValidator(false).constructor.name).toBe(
			'SlotBookingsValidator',
		);
	});

	it('should return out of slot booking validator', () => {
		expect(Container.get(BookingsValidatorFactory).getValidator(true).constructor.name).toBe(
			'OutOfSlotBookingValidator',
		);
	});

	it('should not allow booking out of timeslots due to unavailability', async () => {
		const start = new Date(2020, 8, 26, 8, 0);
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 45))
			.withServiceProviderId(1)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.build();
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders();
			entry.startTime = new Date(2020, 8, 26, 8, 0);
			entry.endTime = new Date(2020, 8, 26, 8, 45);

			const map = new Map<ServiceProvider, TimeslotWithCapacity>();
			map.set(serviceProvider, new TimeslotWithCapacity(entry.startTime, entry.endTime, 1));

			entry.setRelatedServiceProviders(map);

			return Promise.resolve([entry]);
		});

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.acceptedBookings = [bookingMock];
		UnavailabilitiesServiceMock.isUnavailable.mockReturnValue(true);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		const test = async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking);
		await expect(test).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10001] The service provider is not available in the selected time range]',
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
			.build();

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking),
		).rejects.toMatchInlineSnapshot('[BusinessError: [10006] Citizen name not provided]');
	});

	it('should concatenate validations', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withServiceProviderId(1)
			.build();

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking),
		).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10005] Citizen Uin/Fin not found, [10006] Citizen name not provided, [10007] Citizen email not provided]',
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
			.build();
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking),
		).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10010] Service provider is required for out of slot bookings]',
		);
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
			.build();
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

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
			.build();
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
			.build();
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
			.build();

		BookingRepositoryMock.searchBookingsMock = [];
		const timeslotWithCapacity = new TimeslotWithCapacity(
			new Date('2020-10-01T01:00:00'),
			new Date('2020-10-01T02:00:00'),
		);
		TimeslotsServiceMock.availableProvidersForTimeslot.set(serviceProvider, timeslotWithCapacity);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toThrowError();
	});

	it('should throw on validation error', async () => {
		const booking = new BookingBuilder()
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		const timeslotWithCapacity = new TimeslotWithCapacity(
			new Date('2020-10-01T01:00:00'),
			new Date('2020-10-01T02:00:00'),
		);
		TimeslotsServiceMock.availableProvidersForTimeslot.set(serviceProvider, timeslotWithCapacity);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		const asyncTest = async () =>
			await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking);
		await expect(asyncTest).rejects.toThrowError();
	});

	it('should validate available service providers', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.build();
		BookingRepositoryMock.searchBookingsMock = [
			new BookingBuilder()
				.withServiceId(1)
				.withStartDateTime(new Date('2020-10-01T01:00:00'))
				.withEndDateTime(new Date('2020-10-01T02:00:00'))
				.build(),
		];
		TimeslotsServiceMock.availableProvidersForTimeslot = new Map<ServiceProvider, TimeslotWithCapacity>();
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10002] No available service providers in the selected time range]',
		);
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
			.build();

		BookingRepositoryMock.searchBookingsMock = [
			new BookingBuilder()
				.withServiceId(1)
				.withStartDateTime(new Date('2020-10-01T01:00:00'))
				.withEndDateTime(new Date('2020-10-01T02:00:00'))
				.build(),
		];
		TimeslotsServiceMock.availableProvidersForTimeslot = new Map<ServiceProvider, TimeslotWithCapacity>();
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
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceProviderId(1)
			.build();

		BookingRepositoryMock.searchBookingsMock = [];
		const timeslotWithCapacity = new TimeslotWithCapacity(
			new Date('2020-10-01T01:00:00'),
			new Date('2020-10-01T02:00:00'),
		);
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		TimeslotsServiceMock.availableProvidersForTimeslot.set(serviceProvider, timeslotWithCapacity);

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(null));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toMatchInlineSnapshot('[BusinessError: [10005] Citizen Uin/Fin not found]');
	});

	it('should not allow booking on top of existing booking', async () => {
		const start = new Date(2020, 8, 26, 8, 0);
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withServiceProviderId(1)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.build();

		BookingRepositoryMock.searchBookingsMock = [
			new BookingBuilder()
				.withServiceId(1)
				.withStartDateTime(new Date(2020, 8, 26, 8, 15))
				.withEndDateTime(new Date(2020, 8, 26, 8, 45))
				.build(),
		];
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders();
			entry.startTime = new Date(2020, 8, 26, 8, 0);
			entry.endTime = new Date(2020, 8, 26, 8, 45);

			const map = new Map<ServiceProvider, TimeslotWithCapacity>();
			map.set(serviceProvider, new TimeslotWithCapacity(entry.startTime, entry.endTime, 1));

			entry.setRelatedServiceProviders(map);

			return Promise.resolve([entry]);
		});

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		const test = async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking);
		await expect(test).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10003] Booking request not valid as it overlaps another accepted booking]',
		);
	});
});
