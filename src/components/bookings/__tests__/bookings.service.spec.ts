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
import { BookingBuilder } from "../../../models/entities/booking";
import { BookingsValidatorFactory, IValidator } from "../validator/bookings.validation";

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
	const bookingMock = new BookingBuilder().withServiceId(1).withStartDateTime(new Date('2020-10-01T01:00:00')).withEndDateTime(new Date('2020-10-01T02:00:00')).withRefId('REFID').build()

	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name'
	});
	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

	class BookingValidatorFactoryMock extends BookingsValidatorFactory {
		static validate = jest.fn();

		getValidator(outOfSlotBooking: boolean): IValidator {
			return new class implements IValidator {
				async validate(booking: Booking) {
					return Promise.resolve(BookingValidatorFactoryMock.validate(booking));
				}
			}
		}
	}

	let snapshot;

	beforeAll(() => {
		snapshot = Container.snapshot();
		Container.bind(BookingsRepository).to(BookingRepositoryMock);
		Container.bind(CalendarsService).to(CalendarsServiceMock);
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		Container.bind(UnavailabilitiesService).to(UnavailabilitiesServiceMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(BookingsValidatorFactory).to(BookingValidatorFactoryMock);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(() => {
		snapshot.restore();
	})

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

	it("should accept booking", async () => {
		const bookingService = Container.get(BookingsService);
		CalendarsServiceMock.eventId = "event-id";
		BookingRepositoryMock.booking = new BookingBuilder().withServiceId(1).withStartDateTime(new Date('2020-10-01T01:00:00')).withEndDateTime(new Date('2020-10-01T02:00:00')).build();
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
		BookingRepositoryMock.booking = new BookingBuilder().withServiceId(1).withStartDateTime(new Date('2020-10-01T01:00:00')).withEndDateTime(new Date('2020-10-01T02:00:00')).build();
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
});

export class BookingRepositoryMock extends BookingsRepository {
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

export class CalendarsServiceMock extends CalendarsService {
	public static eventId: string;

	public async createCalendarEvent(booking: Booking, calendar: Calendar): Promise<string> {
		return Promise.resolve(CalendarsServiceMock.eventId);
	}
}

export class TimeslotsServiceMock extends TimeslotsService {
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

export class ServiceProvidersRepositoryMock extends ServiceProvidersRepository {
	public static getServiceProviderMock: ServiceProvider;

	public async getServiceProvider(): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProviderMock);
	}
}

export class UnavailabilitiesServiceMock extends UnavailabilitiesService {
	public static isUnavailable = jest.fn();

	public async isUnavailable(...params): Promise<any> {
		return await UnavailabilitiesServiceMock.isUnavailable(...params);
	}
}

export class UserContextMock extends UserContext {
	public static getCurrentUser = jest.fn();

	public init() {
	}

	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(params);
	}
}
