import {Inject, InRequestScope} from "typescript-ioc";
import {Booking, Calendar} from "../../models";
import {CalendarsRepository} from "./calendars.repository";
import {GoogleCalendarService} from "../../googleapi/google.calendar.service";
import {CalendarUserModel} from "./calendars.apicontract";
import {isEmptyArray} from "../../tools/arrays";

@InRequestScope
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

	public async getAvailableGoogleCalendarsForTimeSlot(
		startTime: Date,
		endTime: Date,
		calendars: Calendar[]
	) {
		const googleCalendarIds = calendars.map((cal) => ({
			id: cal.googleCalendarId.toString(),
		}));

		const googleCalendars = await this.googleCalendarApi.getAvailableGoogleCalendars(startTime, endTime, googleCalendarIds);

		return calendars.filter((calendar) => isEmptyArray(googleCalendars[calendar.googleCalendarId].busy));
	}

	public async createCalendarEvent(booking: Booking, calendar: Calendar): Promise<string> {
		return await this.googleCalendarApi.createEvent(booking, calendar.googleCalendarId);
	}

	public async deleteCalendarEvent(calendar: Calendar, eventId: string) {
		await this.googleCalendarApi.deleteEvent(calendar.googleCalendarId, eventId);
	}

	public async addUser(calendarUUID: string, model: CalendarUserModel): Promise<CalendarUserModel> {
		const calendar = await this.calendarsRepository.getCalendarByUUID(calendarUUID);

		const response = await this.googleCalendarApi.addCalendarUser(
			calendar.googleCalendarId,
			{ role: "reader", email: model.email }
		);

		return {
			email: response.email,
		} as CalendarUserModel;
	}
}
