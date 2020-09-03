import { DateHelper } from "../../../../infrastructure/dateHelper";
import { Container } from "typescript-ioc";
import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { BookingsRepository } from "../../bookings.repository";
import { Calendar, ServiceProvider } from "../../../../models/entities";
import { CalendarsService } from "../../../calendars/calendars.service";
import { TimeslotsService } from "../../../timeslots/timeslots.service";
import { ServiceProvidersRepository } from "../../../serviceProviders/serviceProviders.repository";
import { UnavailabilitiesService } from "../../../unavailabilities/unavailabilities.service";
import { UserContext } from "../../../../infrastructure/userContext.middleware";
import { BookingBuilder } from "../../../../models/entities/booking";
import { User } from "../../../../models";
import { BookingsValidatorFactory } from "../bookings.validation";
import {
	BookingRepositoryMock,
	CalendarsServiceMock,
	ServiceProvidersRepositoryMock,
	TimeslotsServiceMock,
	UnavailabilitiesServiceMock,
	UserContextMock
} from "../../__tests__/bookings.service.spec";

describe('Booking validation tests', () => {
	const calendar = new Calendar();
	calendar.id = 1;
	calendar.uuid = '123';
	calendar.googleCalendarId = 'google-id-1';
	const serviceProvider = ServiceProvider.create('provider', calendar, 1);
	serviceProvider.id = 1;
	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

	const bookingMock = new BookingBuilder().withServiceId(1).withStartDateTime(new Date('2020-10-01T01:00:00')).withEndDateTime(new Date('2020-10-01T02:00:00')).withRefId('REFID').build()

	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name'
	});

	beforeAll(() => {
		Container.bind(BookingsRepository).to(BookingRepositoryMock);
		Container.bind(CalendarsService).to(CalendarsServiceMock);
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		Container.bind(UnavailabilitiesService).to(UnavailabilitiesServiceMock);
		Container.bind(UserContext).to(UserContextMock);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should return regular booking validator', () => {
		expect(Container.get(BookingsValidatorFactory).getValidator(false).constructor.name).toBe('SlotBookingsValidator');
	});

	it('should return out of slot booking validator', () => {
		expect(Container.get(BookingsValidatorFactory).getValidator(true).constructor.name).toBe('OutOfSlotBookingValidator');
	});

	it("should validate service provider when saving direct booking", async () => {
		const start = new Date();
		const booking = new BookingBuilder().withStartDateTime(start).withEndDateTime(DateHelper.addMinutes(start, 45)).withServiceProviderId(5).build();

		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		ServiceProvidersRepositoryMock.getServiceProviderMock = null;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking))
			.rejects.toStrictEqual(
				new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage("Service provider '5' not found"));
	});


	it("should not allow booking out of timeslots due to unavailability", async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 45))
			.withServiceProviderId(5)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.build();

		BookingRepositoryMock.searchBookingsMock = [];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		TimeslotsServiceMock.acceptedBookings = [bookingMock];
		UnavailabilitiesServiceMock.isUnavailable.mockReturnValue(true);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		const test = async () => await Container.get(BookingsValidatorFactory).getValidator(true).validate(booking);
		await expect(test).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`The service provider is not available in the selected time range`)
		);
	});

	it("should validate end date time", async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, -30))
			.build();

		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking)).rejects.toThrowError();
	});

	it('should throw on booking save error', async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 30))
			.build();

		BookingRepositoryMock.saveMock = Promise.reject(new Error('Some DB error'));
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking)).rejects.toThrowError();
	});

	it("should validate available service providers", async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withCitizenUinFin('G3382058K')
			.build();
		BookingRepositoryMock.searchBookingsMock = [new BookingBuilder().withServiceId(1).withStartDateTime(new Date('2020-10-01T01:00:00')).withEndDateTime(new Date('2020-10-01T02:00:00')).build()];
		TimeslotsServiceMock.availableProvidersForTimeslot = [];
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking))
			.rejects
			.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('No available service providers in the selected time range'));
	});

	it("should validate availability for direct booking", async () => {
		const start = new Date();
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(DateHelper.addMinutes(start, 60))
			.withCitizenUinFin('G3382058K')
			.build();

		BookingRepositoryMock.searchBookingsMock = [
			new BookingBuilder().withServiceId(1).withStartDateTime(new Date('2020-10-01T01:00:00')).withEndDateTime(new Date('2020-10-01T02:00:00')).build()
		];
		TimeslotsServiceMock.availableProvidersForTimeslot = [];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(async () =>  await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking))
			.rejects
			.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('No available service providers in the selected time range'));
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
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(null));

		await expect(async () => await Container.get(BookingsValidatorFactory).getValidator(false).validate(booking))
			.rejects
			.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Citizen Uin/Fin not found'));
	});

});
