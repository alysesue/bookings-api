import { DateHelper } from '../../../../infrastructure/dateHelper';
import { Container } from 'typescript-ioc';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { BookingsRepository } from '../../bookings.repository';
import { Calendar, ServiceProvider } from '../../../../models/entities';
import { CalendarsService } from '../../../calendars/calendars.service';
import { TimeslotsService } from '../../../timeslots/timeslots.service';
import { ServiceProvidersRepository } from '../../../serviceProviders/serviceProviders.repository';
import { UnavailabilitiesService } from '../../../unavailabilities/unavailabilities.service';
import { UserContext } from '../../../../infrastructure/auth/userContext';
import { BookingBuilder } from '../../../../models/entities/booking';
import { User } from '../../../../models';
import { BookingsValidatorFactory } from '../bookings.validation';
import {
	BookingRepositoryMock,
	CalendarsServiceMock,
	ServiceProvidersRepositoryMock,
	TimeslotsServiceMock,
	UnavailabilitiesServiceMock,
	UserContextMock,
} from '../../__tests__/bookings.mocks';

// tslint:disable-next-line:no-big-function
describe('Booking validation tests', () => {
	const calendar = new Calendar();
	calendar.id = 1;
	calendar.uuid = '123';
	calendar.googleCalendarId = 'google-id-1';
	const serviceProvider = ServiceProvider.create('provider', 1);
	serviceProvider.id = 1;
	serviceProvider.calendar = calendar;
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
		Container.bind(CalendarsService).to(CalendarsServiceMock);
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(UnavailabilitiesService).to(UnavailabilitiesServiceMock);
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		Container.bind(UserContext).to(UserContextMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
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
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 45))
			.withServiceProviderId(1)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.build();

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.acceptedBookings = [bookingMock];
		UnavailabilitiesServiceMock.isUnavailable.mockReturnValue(true);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		const test = async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking);
		await expect(test).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`The service provider is not available in the selected time range`,
			),
		);
	});

	it('should validate end date time', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, -30))
			.build();

		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toThrowError();
	});

	it('should throw on validation error', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 30))
			.build();

		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
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
		TimeslotsServiceMock.availableProvidersForTimeslot = [];
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				'No available service providers in the selected time range',
			),
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
			.build();

		BookingRepositoryMock.searchBookingsMock = [
			new BookingBuilder()
				.withServiceId(1)
				.withStartDateTime(new Date('2020-10-01T01:00:00'))
				.withEndDateTime(new Date('2020-10-01T02:00:00'))
				.build(),
		];
		TimeslotsServiceMock.availableProvidersForTimeslot = [];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				'No available service providers in the selected time range',
			),
		);
	});

	it('should validate no citizenUinFin', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 45))
			.withServiceProviderId(5)
			.build();

		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(null));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Citizen Uin/Fin not found'));
	});

	it('should validate email', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('invalidemail.com')
			.build();

		BookingRepositoryMock.searchBookingsMock = [
			new BookingBuilder()
				.withServiceId(1)
				.withStartDateTime(new Date('2020-10-01T01:00:00'))
				.withEndDateTime(new Date('2020-10-01T02:00:00'))
				.build(),
		];
		TimeslotsServiceMock.availableProvidersForTimeslot = [];
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(
			async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking),
		).rejects.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Citizen email not valid'));
	});
});
