import {Inject, Singleton} from 'typescript-ioc';
import {Booking, Calendar} from '../models';
import {CalendarsRepository} from './calendars.repository';
import {GoogleCalendarService} from '../googleapi/google.calendar.service';
import {CalendarUserModel} from './calendars.apicontract';

@Singleton
export class CalendarsService {

	@Inject
	private calendarsRepository: CalendarsRepository;

	@Inject
	private googleCalendarApi: GoogleCalendarService;

	public async getCalendars(): Promise<Calendar[]> {
		return await this.calendarsRepository.getCalendars();
	}

	public async createCalendar(): Promise<Calendar> {
		const googleCalendarId = await this.googleCalendarApi.createCalendar();

		const calendar = new Calendar();
		calendar.googleCalendarId = googleCalendarId;

		return await this.calendarsRepository.saveCalendar(calendar);
	}

	private static isEmptyArray(array) {
		return Array.isArray(array) && array.length === 0;
	}

	public async validateTimeSlot(booking: Booking) {
		const calendars = await this.getCalendars();
		const availableCalendars = await this.getAvailableCalendarsForTimeSlot(booking, calendars);

		if (CalendarsService.isEmptyArray(availableCalendars)) {
			throw new Error("No available calendars for this timeslot");
		}
	}

	public async getAvailableCalendarsForTimeSlot(booking: Booking, calendars: Calendar[]) {
		const googleCalendarIds = calendars.map(cal => ({ id: cal.googleCalendarId.toString() }));

		const availableGoogleCalendars =
			await this.googleCalendarApi.getAvailableGoogleCalendars(booking.startDateTime, booking.getSessionEndTime(), googleCalendarIds);

		return calendars.filter(calendar =>
			CalendarsService.isEmptyArray(availableGoogleCalendars[calendar.googleCalendarId].busy));
	}

	public async createEvent(booking: Booking) {
		// TODO:
		await this.getCalendarForBookingRequest(booking);
		// TODO : await this.googleCalendarApi.createEvent(booking, calendar.googleCalendarId);
	}

	public async addUser(calendarUUID: string, model: CalendarUserModel): Promise<CalendarUserModel> {
		const calendar = await this.calendarsRepository.getCalendarByUUID(calendarUUID);

		const response = await this.googleCalendarApi.addCalendarUser(calendar.googleCalendarId, { role: "reader", email: model.email });

		return {
			email: response.email
		} as CalendarUserModel;
	}

	private async getCalendarForBookingRequest(booking: Booking): Promise<Calendar> {
		const calendars = await this.getCalendars();
		const availableCalendars = await this.getAvailableCalendarsForTimeSlot(booking, calendars);

		if (!(Array.isArray(availableCalendars) && availableCalendars.length)) {
			throw new Error(`No available calendars for booking ${booking.id}`);
		}
		return availableCalendars[0];
	}
}
