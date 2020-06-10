import { BookingsService } from "..";
import { BookingsRepository } from "../bookings.repository";
import { CalendarsService } from "../../calendars/calendars.service";
import { Container } from "typescript-ioc";
import { Booking, BookingStatus, Calendar, Service, ServiceProvider } from "../../models/";
import { InsertResult } from "typeorm";
import { BookingAcceptRequest, BookingRequest, BookingSearchRequest } from "../bookings.apicontract";
import { AvailableTimeslotProviders, TimeslotsService } from '../../timeslots/timeslots.service';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';

describe("Bookings.Service", () => {
	const service = new Service();
	const calendar = new Calendar();
	calendar.id = 1;
	calendar.uuid = '123';
	calendar.googleCalendarId = 'google-id-1';
	const serviceProvider = new ServiceProvider(service, 'provider', calendar);
	serviceProvider.id = 1;

	beforeAll(() => {
		Container.bind(BookingsRepository).to(BookingRepositoryMock);
		Container.bind(CalendarsService).to(CalendarsServiceMock);
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
	});

	it("should get all bookings", async () => {
		BookingRepositoryMock.getBookingsMock = [new Booking(1, new Date(), 60)];
		const result = await Container.get(BookingsService).getBookings();

		expect(result.length).toBe(1);
	});

	it("should save booking from booking request", async () => {
		const bookingRequest: BookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();
		BookingRepositoryMock.searchBookingsMock = [];
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];

		await Container.get(BookingsService).save(bookingRequest, 1);

		const booking = BookingRepositoryMock.booking;
		expect(booking).not.toBe(undefined);
		expect(booking.status).toBe(BookingStatus.PendingApproval);
	});

	it("should accept booking", async () => {
		const bookingService = Container.get(BookingsService);
		CalendarsServiceMock.eventId = "event-id";
		BookingRepositoryMock.booking = new Booking(1, new Date(), 60);
		TimeslotsServiceMock.availableProvidersForTimeslot = [serviceProvider];
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProvider;

		const acceptRequest = new BookingAcceptRequest();
		acceptRequest.serviceProviderId = 1;
		const result = await bookingService.acceptBooking("1", acceptRequest);

		expect(result.status).toBe(BookingStatus.Accepted);
		expect(result.eventICalId).toBe("event-id");
	});

	it("should throw exception if booking not found", async () => {
		const bookingService = Container.get(BookingsService);
		BookingRepositoryMock.booking = undefined;
		await expect(bookingService.getBooking("1")).rejects.toEqual(
			new Error("Booking 1 not found")
		);
	});

	it("should validate booking request", async () => {
		const bookingRequest = new BookingRequest();
		bookingRequest.startDateTime = new Date();

		BookingRepositoryMock.searchBookingsMock = [new Booking(1, new Date(), 10)];
		TimeslotsServiceMock.availableProvidersForTimeslot = [];

		const bookingService = Container.get(BookingsService);
		await expect(bookingService.save(bookingRequest, 1))
			.rejects
			.toStrictEqual(new Error('No available service providers for this timeslot'));
	});
});

class BookingRepositoryMock {
	public static booking: Booking;
	public static getBookingsMock: Booking[];
	public static searchBookingsMock: Booking[];

	public async getBookings(): Promise<Booking[]> {
		return Promise.resolve(BookingRepositoryMock.getBookingsMock);
	}

	public async getBooking(id: string): Promise<Booking> {
		return Promise.resolve(BookingRepositoryMock.booking);
	}

	public async save(booking: Booking): Promise<InsertResult> {
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

	public async getServiceProvider(id: number): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProviderMock);
	}
}
