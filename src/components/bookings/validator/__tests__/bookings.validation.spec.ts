import { DateHelper } from '../../../../infrastructure/dateHelper';
import { Container } from 'typescript-ioc';
import { BookingsRepository } from '../../bookings.repository';
import { ServiceProvider } from '../../../../models/entities';
import { TimeslotsService } from '../../../timeslots/timeslots.service';
import { ServiceProvidersRepository } from '../../../serviceProviders/serviceProviders.repository';
import { UnavailabilitiesService } from '../../../unavailabilities/unavailabilities.service';
import { UserContext } from '../../../../infrastructure/auth/userContext';
import { Booking, BookingBuilder } from '../../../../models/entities/booking';
import { Service, User } from '../../../../models';
import { BookingsValidatorFactory } from '../bookings.validation';
import {
	BookingRepositoryMock,
	ServiceProvidersRepositoryMock,
	TimeslotsServiceMock,
	UnavailabilitiesServiceMock,
} from '../../__tests__/bookings.mocks';
import { TimeslotWithCapacity } from '../../../../models/timeslotWithCapacity';
import { AvailableTimeslotProviders } from '../../../../components/timeslots/availableTimeslotProviders';
import { CaptchaService } from '../../../captcha/captcha.service';
import { UserContextMock } from '../../../../infrastructure/auth/__mocks__/userContext';
import { getConfig } from '../../../../config/app-config';
import { IPagedEntities } from '../../../../core/pagedEntities';

const createTimeslot = (startTime: Date, endTime: Date, capacity?: number) => {
	return {
		startTimeNative: startTime.getTime(),
		endTimeNative: endTime.getTime(),
		capacity: capacity || 1,
	} as TimeslotWithCapacity;
};

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

// tslint:disable-next-line:no-big-function
describe('Booking validation tests', () => {
	let serviceProvider;
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

		serviceProvider = ServiceProvider.create('provider', 1);
		serviceProvider.id = 1;
		ServiceProvidersRepositoryMock.getServiceProviderMock = undefined;

		const mockVerify = jest.fn();
		mockVerify.mockReturnValue(Promise.resolve(true));
		CaptchaService.verify = mockVerify;
		(getConfig as jest.Mock).mockReturnValue({
			isAutomatedTest: false,
		});

		BookingRepositoryMock.searchBookings.mockImplementation(() =>
			Promise.resolve({ entries: [] } as IPagedEntities<Booking>),
		);

		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => Promise.resolve([]));
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
			entry.startTime = new Date(2020, 8, 26, 8, 0).getTime();
			entry.endTime = new Date(2020, 8, 26, 8, 45).getTime();

			const map = new Map<ServiceProvider, TimeslotWithCapacity>();
			map.set(serviceProvider, createTimeslotNative(entry.startTime, entry.endTime, 1));

			entry.setRelatedServiceProviders(map);

			return Promise.resolve([entry]);
		});

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		TimeslotsServiceMock.acceptedBookings = [bookingMock];
		UnavailabilitiesServiceMock.isUnavailable.mockReturnValue(true);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		const test = async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking);
		await expect(test).rejects.toMatchInlineSnapshot(
			'[BusinessError: [10001] The service provider is not available in the selected time range]',
		);
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
			.build();
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders();
			entry.startTime = new Date(2020, 8, 26, 8, 0).getTime();
			entry.endTime = new Date(2020, 8, 26, 8, 45).getTime();

			const map = new Map<ServiceProvider, TimeslotWithCapacity>();
			map.set(serviceProvider, createTimeslotNative(entry.startTime, entry.endTime, 1));

			entry.setRelatedServiceProviders(map);

			return Promise.resolve([entry]);
		});

		serviceProvider.expiryDate = new Date();
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		TimeslotsServiceMock.acceptedBookings = [bookingMock];
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
			.build();

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking),
		).rejects.toMatchInlineSnapshot('[BusinessError: [10006] Citizen name not provided]');
	});

	it('should validate token', async () => {
		(CaptchaService.verify as jest.Mock).mockRestore();
		const booking = new BookingBuilder()
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.withCitizenName('Andy')
			.withCitizenUinFin('G3382058K')
			.withCitizenEmail('email@gmail.com')
			.build();

		const timeslotWithCapacity = createTimeslot(new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'));
		TimeslotsServiceMock.availableProvidersForTimeslot.set(serviceProvider, timeslotWithCapacity);

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
			.build();

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
			.build();
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
			.build();
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
			.build();
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

		const timeslotWithCapacity = createTimeslot(new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'));
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

		const timeslotWithCapacity = createTimeslot(new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'));
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

		const timeslotWithCapacity = createTimeslot(new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'));
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		TimeslotsServiceMock.availableProvidersForTimeslot.set(serviceProvider, timeslotWithCapacity);

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(null));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toMatchInlineSnapshot('[BusinessError: [10005] Citizen UIN/FIN not found]');
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

		BookingRepositoryMock.searchBookings.mockImplementation(() =>
			Promise.resolve({
				entries: [
					new BookingBuilder()
						.withServiceId(1)
						.withStartDateTime(new Date(2020, 8, 26, 8, 15))
						.withEndDateTime(new Date(2020, 8, 26, 8, 45))
						.build(),
				],
			} as IPagedEntities<Booking>),
		);
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders();
			entry.startTime = new Date(2020, 8, 26, 8, 0).getTime();
			entry.endTime = new Date(2020, 8, 26, 8, 45).getTime();

			const map = new Map<ServiceProvider, TimeslotWithCapacity>();
			map.set(serviceProvider, createTimeslotNative(entry.startTime, entry.endTime, 1));

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

	it('should allow updating booking to out of slot', async () => {
		const booking = new BookingBuilder()
			.withStartDateTime(new Date(2020, 8, 26, 8, 15))
			.withEndDateTime(new Date(2020, 8, 26, 8, 45))
			.withServiceProviderId(1)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.build();
		booking.id = 5;

		const searchBooking = new BookingBuilder()
			.withStartDateTime(new Date(2020, 8, 26, 7, 15))
			.withEndDateTime(new Date(2020, 8, 26, 7, 45))
			.withServiceProviderId(1)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.build();
		searchBooking.id = 5;

		BookingRepositoryMock.searchBookings.mockImplementation(() =>
			Promise.resolve({ entries: [searchBooking] } as IPagedEntities<Booking>),
		);

		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders();
			entry.startTime = new Date(2020, 8, 26, 7, 15).getTime();
			entry.endTime = new Date(2020, 8, 26, 7, 45).getTime();

			const map = new Map<ServiceProvider, TimeslotWithCapacity>();
			map.set(serviceProvider, createTimeslotNative(entry.startTime, entry.endTime, 1));

			entry.setRelatedServiceProviders(map);

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
			.build();
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
			const entry = new AvailableTimeslotProviders();
			entry.startTime = DateHelper.addMinutes(start, 15).getTime();
			entry.endTime = DateHelper.addMinutes(start, 45).getTime();

			const map = new Map<ServiceProvider, TimeslotWithCapacity>();
			map.set(serviceProvider, createTimeslotNative(entry.startTime, entry.endTime, 1));

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
			.build();
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
			.build();
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking),
		).rejects.toMatchInlineSnapshot('[BusinessError: [10014] Invalid video conference link is provided]');
	});
});
