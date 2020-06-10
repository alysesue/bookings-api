import { CalendarsController } from "../calendars.controller";
import { Container } from "typescript-ioc";
import { CalendarsService } from "../calendars.service";
import { BookingsService } from "../../bookings";
import { Booking, Calendar } from "../../models";
import { BookingSearchRequest } from "../../bookings/bookings.apicontract";

describe('Calendars.controller', () => {
	beforeAll(() => {
		Container.bind(CalendarsService).to(CalendarsServiceMock);
		Container.bind(BookingsService).to(BookingsServiceMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should return calendars', async () => {
		const calendar = new Calendar();
		calendar.id = 1;
		calendar.uuid = 'uuid';
		calendar.googleCalendarId = "google-id-1";
		CalendarsServiceMock.mockCalendars = [calendar];

		BookingsServiceMock.mockBookings = [new Booking(1, new Date(), 60)];

		const controller = Container.get(CalendarsController);
		const result = await controller.getCalendars();

		expect(result).toHaveLength(1);
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
