import {Inject, Singleton} from "typescript-ioc";
import {Booking, Calendar} from "../models";
import {CalendarsRepository} from "./calendars.repository";
import {GoogleCalendarService} from "../googleapi/google.calendar.service";
import {AddCalendarModel, CalendarUserModel} from "./calendars.apicontract";

@Singleton
export class CalendarsService {
	@Inject
	private calendarsRepository: CalendarsRepository;

	@Inject
	private googleCalendarApi: GoogleCalendarService;

	private static isEmptyArray(array) {
		return Array.isArray(array) && array.length === 0;
	}

	public async getCalendars(): Promise<Calendar[]> {
		return await this.calendarsRepository.getCalendars();
	}

	public async createCalendar(model: AddCalendarModel): Promise<Calendar> {
		const googleCalendarId = await this.googleCalendarApi.createCalendar();

		const calendar = new Calendar();
		calendar.serviceProviderName = model.serviceProviderName;

		calendar.googleCalendarId = googleCalendarId;

		return await this.calendarsRepository.saveCalendar(calendar);
	}

	public async validateTimeSlot(booking: Booking) {
		const calendars = await this.searchCalendars(booking.startDateTime, booking.getSessionEndTime());

		if (CalendarsService.isEmptyArray(calendars)) {
			throw new Error("No available calendars for this timeslot");
		}
	}

	public async searchCalendars(startTime: Date, endTime: Date): Promise<Calendar[]> {
		const calendars = await this.getCalendars();
		return await this.getAvailableCalendarsForTimeSlot(startTime, endTime, calendars);
	}

	public async validateGoogleCalendarForTimeSlot(booking: Booking, calendar: Calendar) {
		const googleCalendarResult = await this.googleCalendarApi.getAvailableGoogleCalendars(
			booking.startDateTime,
			booking.getSessionEndTime(),
			[{id: calendar.googleCalendarId}]
		);

		return CalendarsService.isEmptyArray(googleCalendarResult[calendar.googleCalendarId].busy);
	}

	public async getAvailableCalendarsForTimeSlot(
		startTime: Date,
		endTime: Date,
		calendars: Calendar[]
	) {
		const googleCalendarIds = calendars.map((cal) => ({
			id: cal.googleCalendarId.toString(),
		}));

		const googleCalendars = await this.googleCalendarApi.getAvailableGoogleCalendars(startTime, endTime, googleCalendarIds);

		return calendars.filter((calendar) =>
			CalendarsService.isEmptyArray(googleCalendars[calendar.googleCalendarId].busy));
	}

	public async createEvent(booking: Booking, calendarId: string): Promise<string> {
		const calendar = await this.getCalendarForBookingRequest(booking, calendarId);
		return await this.googleCalendarApi.createEvent(booking, calendar.googleCalendarId);
	}

	public async addUser(calendarUUID: string, model: CalendarUserModel): Promise<CalendarUserModel> {
		const calendar = await this.calendarsRepository.getCalendarByUUID(calendarUUID);

		const response = await this.googleCalendarApi.addCalendarUser(
			calendar.googleCalendarId,
			{role: "reader", email: model.email}
		);

		return {
			email: response.email,
		} as CalendarUserModel;
	}

	private async getCalendarForBookingRequest(booking: Booking, calendarId: string): Promise<Calendar> {
		const calendar = await this.calendarsRepository.getCalendarByUUID(calendarId);
		if (!calendar) {
			throw new Error(`Calendar ${calendarId} does not exist`);
		}
		if (!(await this.validateGoogleCalendarForTimeSlot(booking, calendar))) {
			throw new Error(`Calendar ${calendarId} is not available for this timeslot`);
		}
		return calendar;
	}
}
