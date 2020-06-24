import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { BookingsService } from "..";
import { BookingsRepository } from "../bookings.repository";
import { CalendarsService } from "../../calendars/calendars.service";
import { Container } from "typescript-ioc";
import { Booking, BookingStatus, Calendar, Service, ServiceProvider } from "../../models/";
import { InsertResult } from "typeorm";
import { BookingAcceptRequest, BookingRequest, BookingSearchRequest } from "../bookings.apicontract";
import { AvailableTimeslotProviders, TimeslotsService } from '../../timeslots/timeslots.service';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { DateHelper } from "../../infrastructure/dateHelper";

describe("Bookings.Service", () => {
	const calendar = new Calendar();
	calendar.id = 1;
	calendar.uuid = '123';
	calendar.googleCalendarId = 'google-id-1';
	const serviceProvider = ServiceProvider.create('provider', calendar, 1);
	serviceProvider.id = 1;

	beforeAll(() => {
		Container.bind(BookingsRepository).to(BookingRepositoryMock);
		Container.bind(CalendarsService).to(CalendarsServiceMock);
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it("should get all bookings", async () => {
		BookingRepositoryMock.getBookingsMock = [Booking.create(1, new Date(), 60)];
		const result = await Container.get(BookingsService).getBookings();

		expect(result.length).toBe(1);
	});

	it("should save booking from booking request", async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 45);
		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.PendingApproval);
	});

	it("should validate end date time", async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, -30);
		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];

		const service = Container.get(BookingsService);
		await expect(() => service.save(bookingRequest, 1)).rejects.toThrowError();
	});

	it('should throw on booking save error', async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 30);
		BookingRepositoryMock.saveMock = Promise.reject(new Error('Some DB error'));
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];

		const service = Container.get(BookingsService);
		await expect(() => service.save(bookingRequest, 1)).rejects.toThrowError();
	});

	it("should accept booking", async () => {
		const bookingService = Container.get(BookingsService);
		CalendarsServiceMock.eventId = "event-id";
		BookingRepositoryMock.booking = Booking.create(1, new Date(), 60);
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		const acceptRequest = new BookingAcceptRequest();
		acceptRequest.serviceProviderId = 1;
		const result = await bookingService.acceptBooking("1", acceptRequest);

		expect(result.status).toBe(BookingStatus.Accepted);
		expect(result.eventICalId).toBe("event-id");
	});


	it("should cancel booking", async () => {
		const bookingService = Container.get(BookingsService);
		CalendarsServiceMock.eventId = "event-id";
		BookingRepositoryMock.booking = Booking.create(1, new Date(), 60);
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;
		const result = await bookingService.cancelBooking("1");

		expect(result.status).toBe(BookingStatus.Cancelled);
	});

	it("should throw exception if booking not found", async () => {
		const bookingService = Container.get(BookingsService);
		BookingRepositoryMock.booking = undefined;
		await expect(bookingService.getBooking("1")).rejects.toEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage("Booking 1 not found")
		);
	});

	it("should validate available service providers", async () => {
		const bookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		bookingRequest.endDateTime = DateHelper.addMinutes(bookingRequest.startDateTime, 60);

		BookingRepositoryMock.searchBookingsMock = [Booking.create(1, new Date(), 10)];
		TimeslotsServiceMock.availableProvidersForTimeslot = [];

		const bookingService = Container.get(BookingsService);
		await expect(bookingService.save(bookingRequest, 1))
			.rejects
			.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('No available service providers for this timeslot'));
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

	public async getBookings(): Promise<Booking[]> {
		return Promise.resolve(BookingRepositoryMock.getBookingsMock);
	}

	public async getBooking(id: string): Promise<Booking> {
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

	public async getAvailableProvidersForTimeslot(startDateTime: Date, endDateTime: Date, serviceId: number): Promise<AvailableTimeslotProviders> {
		const timeslotEntry = new AvailableTimeslotProviders();
		timeslotEntry.startTime = startDateTime;
		timeslotEntry.endTime = startDateTime;
		timeslotEntry.serviceProviders = TimeslotsServiceMock.availableProvidersForTimeslot;

		return timeslotEntry;
	}
}


class ServiceProvidersRepositoryMock extends ServiceProvidersRepository {
	public static getServiceProviderMock: ServiceProvider;

	public async getServiceProvider(): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProviderMock);
	}
}
