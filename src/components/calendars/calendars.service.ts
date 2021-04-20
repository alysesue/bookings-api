import { Inject, InRequestScope } from 'typescript-ioc';
import { Booking } from '../../models';
import { GoogleCalendarService } from '../../googleapi/google.calendar.service';
import { isEmptyArray } from '../../tools/arrays';
import { Calendar } from '../../models/entities/calendar';
import { CalendarUserModel } from './calendars.apicontract';
import { CalendarsRepository } from './calendars.repository';

/**
 * @deprecated The class should not be used, it has been created at the start of the project to link booking with google calendar (with caldav protocole). We dont use it anymore
 */
@InRequestScope
export class CalendarsService {
	@Inject
	private calendarsRepository: CalendarsRepository;
	@Inject
	private googleCalendarApi: GoogleCalendarService;

	private static formatEventId(eventICalId: string): string {
		return eventICalId.split('@')[0];
	}

	public async getCalendars(): Promise<Calendar[]> {
		return await this.calendarsRepository.getCalendars();
	}

	public async createCalendar(): Promise<Calendar> {
		const googleCalendarId = await this.googleCalendarApi.createCalendar();
		const calendar = new Calendar();
		calendar.googleCalendarId = googleCalendarId;
		return await this.calendarsRepository.saveCalendar(calendar);
	}

	public async getAvailableGoogleCalendarsForTimeSlot(startTime: Date, endTime: Date, calendars: Calendar[]) {
		const googleCalendarIds = calendars.map((cal) => ({
			id: cal.googleCalendarId.toString(),
		}));

		const googleCalendars = await this.googleCalendarApi.getAvailableGoogleCalendars(
			startTime,
			endTime,
			googleCalendarIds,
		);

		return calendars.filter((calendar) => isEmptyArray(googleCalendars[calendar.googleCalendarId].busy));
	}

	public async createCalendarEvent(booking: Booking, calendar: Calendar): Promise<string> {
		return await this.googleCalendarApi.createEvent(booking, calendar.googleCalendarId);
	}

	public async deleteCalendarEvent(calendar: Calendar, calendarEventICalId: string) {
		await this.googleCalendarApi.deleteEvent(
			calendar.googleCalendarId,
			CalendarsService.formatEventId(calendarEventICalId),
		);
	}

	public async addUser(calendarUUID: string, model: CalendarUserModel): Promise<CalendarUserModel> {
		const calendar = await this.calendarsRepository.getCalendarByUUID(calendarUUID);

		const response = await this.googleCalendarApi.addCalendarUser(calendar.googleCalendarId, {
			role: 'reader',
			email: model.email,
		});

		return {
			email: response.email,
		} as CalendarUserModel;
	}
}
