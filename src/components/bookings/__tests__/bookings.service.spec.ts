import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { BookingsService } from "../index";
import { BookingsRepository } from "../bookings.repository";
import { CalendarsService } from "../../calendars/calendars.service";
import { Container } from "typescript-ioc";
import { Booking, BookingStatus, Calendar, ServiceProvider, User } from "../../../models";
import { InsertResult } from "typeorm";
import { BookingAcceptRequest, BookingRequest, BookingSearchRequest } from "../bookings.apicontract";
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { AvailableTimeslotProviders } from '../../timeslots/availableTimeslotProviders';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { DateHelper } from "../../../infrastructure/dateHelper";
import { UnavailabilitiesService } from "../../unavailabilities/unavailabilities.service";
import { UserContext } from '../../../infrastructure/userContext.middleware';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

// tslint:disable-next-line: no-big-function
describe("Bookings.Service", () => {
	const calendar = new Calendar();
	calendar.id = 1;
	calendar.uuid = '123';
	calendar.googleCalendarId = 'google-id-1';
	const serviceProvider = ServiceProvider.create('provider', calendar, 1);
	serviceProvider.id = 1;
	const bookingMock = Booking.create(1, new Date("2020-08-10"), new Date("2020-08-11"), 1, 'RHDH');

	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name'
	});
	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

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

	it("should save booking from booking request", async () => {
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

	it("should save direct booking", async () => {
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

	it("should validate service provider when saving direct booking", async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 5;
		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		ServiceProvidersRepositoryMock.getServiceProviderMock = null;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		await expect(async () => await Container.get(BookingsService).save(bookingRequest, 1))
			.rejects.toStrictEqual(
				new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage("Service provider '5' not found"));
	});

	it("should allow booking out of timeslots", async () => {
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

	it("should not allow booking out of timeslots", async () => {
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

	it("should not allow booking out of timeslots due to unavailability", async () => {
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
		UnavailabilitiesServiceMock.isUnavailable.mockReturnValue(true);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));

		const test = async () => await Container.get(BookingsService).save(bookingRequest, 1);
		await expect(test).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`The service provider is not available in the selected time range.`)
		);
	});

	it("should validate end date time", async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, -30);
		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		const service = Container.get(BookingsService);
		await expect(async () => await service.save(bookingRequest, 1)).rejects.toThrowError();
	});

	it('should throw on booking save error', async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 30);
		BookingRepositoryMock.saveMock = Promise.reject(new Error('Some DB error'));
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		const service = Container.get(BookingsService);
		await expect(async () => await service.save(bookingRequest, 1)).rejects.toThrowError();
	});

	it("should accept booking", async () => {
		const bookingService = Container.get(BookingsService);
		CalendarsServiceMock.eventId = "event-id";
		BookingRepositoryMock.booking = Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'));
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		const acceptRequest = new BookingAcceptRequest();
		acceptRequest.serviceProviderId = 1;
		const result = await bookingService.acceptBooking(1, acceptRequest);

		expect(result.status).toBe(BookingStatus.Accepted);
		expect(result.eventICalId).toBe("event-id");
	});

	it("should cancel booking", async () => {
		const bookingService = Container.get(BookingsService);
		BookingRepositoryMock.booking = Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'));
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		const result = await bookingService.cancelBooking(1);

		expect(result.status).toBe(BookingStatus.Cancelled);
	});

	it("should throw exception if booking not found", async () => {
		const bookingService = Container.get(BookingsService);
		BookingRepositoryMock.booking = undefined;
		await expect(async () => await bookingService.getBooking(1)).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage("Booking 1 not found")
		);
	});

	it("should validate available service providers", async () => {
		const bookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 60);

		BookingRepositoryMock.searchBookingsMock = [Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'))];
		TimeslotsServiceMock.availableProvidersForTimeslot = [];
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		const bookingService = Container.get(BookingsService);
		await expect(async () => await bookingService.save(bookingRequest, 1))
			.rejects
			.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('No available service providers for this timeslot'));
	});

	it("should validate availability for direct booking", async () => {
		const bookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 60);

		BookingRepositoryMock.searchBookingsMock = [Booking.create(1, new Date('2020-10-01T01:00:00'), new Date('2020-10-01T02:00:00'))];
		TimeslotsServiceMock.availableProvidersForTimeslot = [];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));

		const bookingService = Container.get(BookingsService);
		await expect(async () => await bookingService.save(bookingRequest, 1))
			.rejects
			.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('No available service providers for this timeslot'));
	});

	it('should validate no citizenUinFin', async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		bookingRequest.serviceProviderId = 5;
		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(null));

		const bookingService = Container.get(BookingsService);

		await expect(async () => await bookingService.save(bookingRequest, 1))
			.rejects
			.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Citizen Uin/Fin not found'));
	});

	it("should return eventId", async () => {
		const bookingService = Container.get(BookingsService);
		const res = bookingService.formatEventId("qmrljumfcqg1gur997fsjcnmto@google.com");
		expect(res).toBe("qmrljumfcqg1gur997fsjcnmto");
	});
});

class BookingRepositoryMock extends BookingsRepository {
	public static booking: Booking;
	public static getBookingsMock: Booking[];
	public static searchBookingsMock: Booking[];
	public static saveMock: Promise<InsertResult>;

	public async getBooking(id: number): Promise<Booking> {
		return Promise.resolve(BookingRepositoryMock.booking);
	}

	public async save(booking: Booking): Promise<InsertResult> {
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

class CalendarsServiceMock extends CalendarsService {
	public static eventId: string;

	public async createCalendarEvent(booking: Booking, calendar: Calendar): Promise<string> {
		return Promise.resolve(CalendarsServiceMock.eventId);
	}
}

class TimeslotsServiceMock extends TimeslotsService {
	public static availableProvidersForTimeslot: ServiceProvider[] = [];
	public static acceptedBookings: Booking[] = [];

	public async getAvailableProvidersForTimeslot(startDateTime: Date, endDateTime: Date, serviceId: number): Promise<AvailableTimeslotProviders> {
		const timeslotEntry = new AvailableTimeslotProviders();
		timeslotEntry.startTime = startDateTime;
		timeslotEntry.endTime = startDateTime;
		timeslotEntry.setRelatedServiceProviders(TimeslotsServiceMock.availableProvidersForTimeslot);

		return timeslotEntry;
	}
}

class ServiceProvidersRepositoryMock extends ServiceProvidersRepository {
	public static getServiceProviderMock: ServiceProvider;

	public async getServiceProvider(): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProviderMock);
	}
}

class UnavailabilitiesServiceMock extends UnavailabilitiesService {
	public static isUnavailable = jest.fn();

	public async isUnavailable(...params): Promise<any> {
		return await UnavailabilitiesServiceMock.isUnavailable(...params);
	}
}

class UserContextMock extends UserContext {
	public static getCurrentUser = jest.fn();

	public init() { }
	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(params);
	}
}
