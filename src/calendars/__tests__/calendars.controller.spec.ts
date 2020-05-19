import { CalendarsController } from "../calendars.controller";
import { Container } from "typescript-ioc";
import { CalendarsService } from "../calendars.service";
import { BookingsService } from "../../bookings";
import { Booking, Calendar } from "../../models";
import { BookingSearchRequest } from "../../bookings/bookings.apicontract";
import { TimeslotsService } from '../../timeslots/timeslots.service';

describe('Calendars.controller', () => {
	beforeAll(() => {
		Container.bind(CalendarsService).to(CalendarsServiceMock);
		Container.bind(BookingsService).to(BookingsServiceMock);
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should get all available calendars', async () => {
		const calendar = new Calendar();
		calendar.serviceProviderName = 'test';
		CalendarsServiceMock.mockCalendars = [calendar];
		TimeslotsServiceMock.availableCalendarsForTimeslot = [calendar];

		const controller = Container.get(CalendarsController);
		const result = await controller.getAvailability(new Date(), new Date());

		expect(result).toHaveLength(1);
	});

	it('should call timeslot availability service', async () => {
		const calendar = new Calendar();
		calendar.serviceProviderName = 'test';
		CalendarsServiceMock.mockCalendars = [calendar];
		TimeslotsServiceMock.availableCalendarsForTimeslot = [calendar];

		BookingsServiceMock.mockBookings = [new Booking(new Date(), 60)];

		const controller = Container.get(CalendarsController);
		const result = await controller.getAvailability(new Date(), new Date());

		expect(result).toBeDefined();
	});

	it('should return calendars', async () => {
		const calendar = new Calendar();
		calendar.serviceProviderName = 'test';
		calendar.id = 1;
		calendar.uuid = 'uuid';
		calendar.googleCalendarId = "google-id-1";
		CalendarsServiceMock.mockCalendars = [calendar];
		TimeslotsServiceMock.availableCalendarsForTimeslot = [calendar];

		BookingsServiceMock.mockBookings = [new Booking(new Date(), 60)];

		const controller = Container.get(CalendarsController);
		const result = await controller.getCalendars();

		expect(result).toHaveLength(1);
		expect(result[0].serviceProviderName).toBe('test');
		expect(result[0].uuid).toBe('uuid');
	});
});

class BookingsServiceMock extends BookingsService {
	public static mockBookings: Booking[] = [];

	public async searchBookings(searchRequest: BookingSearchRequest): Promise<Booking[]> {
		return BookingsServiceMock.mockBookings;
	}
}

class CalendarsServiceMock extends CalendarsService {
	public static mockCalendars: Calendar[] = [];

	public async getCalendars(): Promise<Calendar[]> {
		return CalendarsServiceMock.mockCalendars;
	}
}

class TimeslotsServiceMock extends TimeslotsService {
	public static availableCalendarsForTimeslot: Calendar[] = [];

	public async getAvailableCalendarsForTimeslot(startDateTime: Date, endDateTime: Date): Promise<Calendar[]> {
		return TimeslotsServiceMock.availableCalendarsForTimeslot;
	}
}
