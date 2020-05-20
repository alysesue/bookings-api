import { Container } from "typescript-ioc";
import { BookingsController } from "../index";
import { BookingsRepository } from "../bookings.repository";
import { Booking, BookingStatus, Calendar } from "../../models";
import { CalendarsRepository } from "../../calendars/calendars.repository";
import { GoogleApi } from "../../googleapi/google.api";
import * as insertEventResponse from "./createEventResponse.json";
import * as freebusyResponse from "./freebusyResponse.json";
import { BookingAcceptRequest } from "../bookings.apicontract";
import { TimeslotsService } from '../../timeslots/timeslots.service';

const BookingRepositoryMock = (update) => {
	const testBooking = new Booking(new Date(), 100);
	return jest.fn().mockImplementation(() => ({
		getBooking: jest.fn().mockReturnValue(testBooking),
		update
	}));
};

const CalendarsRepositoryMock = () => {
	const calendar = new Calendar();
	calendar.googleCalendarId = 'google-id-1';
	return jest.fn().mockImplementation(() => ({
		getCalendarByUUID: jest.fn().mockReturnValue(calendar)
	}));
};

const GoogleApiMock = () => {
	return jest.fn().mockImplementation(() => ({
		getCalendarApi: jest.fn().mockReturnValue({
			freebusy: {
				query: jest.fn().mockReturnValue(freebusyResponse)
			},
			events: {
				insert: jest.fn().mockReturnValue(insertEventResponse)
			},
			calendars: jest.fn()
		})
	}));
};

class TimeslotsServiceMock extends TimeslotsService {
	public static availableCalendarsForTimeslot: Calendar[] = [];

	public async getAvailableCalendarsForTimeslot(startDateTime: Date, endDateTime: Date): Promise<Calendar[]> {
		return TimeslotsServiceMock.availableCalendarsForTimeslot;
	}
}


describe('Booking Integration tests', () => {
	it('should accept booking', async () => {
		const updateBooking = jest.fn();
		const calendar = { id: 1, uuid: '123', googleCalendarId: "google-id-1" } as Calendar;
		Container.bind(BookingsRepository).to(BookingRepositoryMock(updateBooking));
		Container.bind(CalendarsRepository).to(CalendarsRepositoryMock());
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(GoogleApi).to(GoogleApiMock());

		TimeslotsServiceMock.availableCalendarsForTimeslot = [calendar];
		const controller = Container.get(BookingsController);

		await controller.acceptBooking('1', { calendarUUID: '123' } as BookingAcceptRequest);

		expect(updateBooking).toBeCalledTimes(1);
		const booking = updateBooking.mock.calls[0][0] as Booking;

		expect(booking.status).toBe(BookingStatus.Accepted);
		expect(booking.eventICalId).toBe('s1ov9v4ic15vcs30dtfgeoclg8@google.com');
	});
});
