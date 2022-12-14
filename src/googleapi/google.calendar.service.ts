import { Inject, InRequestScope } from 'typescript-ioc';
import { Booking } from '../models';
import { CalendarUserModel } from '../components/calendars/calendars.apicontract';
import { CalendarTimezone } from '../const';
import { GoogleApi } from './google.api';

/**
 * @deprecated The class should not be used, it has been created at the start of the project to link booking with google calendar (with caldav protocole). We dont use it anymore
 */
@InRequestScope
export class GoogleCalendarService {
	@Inject
	private googleApi: GoogleApi;

	public async createCalendar() {
		const api = await this.googleApi.getCalendarApi();

		const calendarRequest = {
			requestBody: {
				summary: 'Booking SG Calendar',
				timeZone: CalendarTimezone,
			},
		};
		const response = await api.calendars.insert(calendarRequest);

		return response.data.id;
	}

	public async getAvailableGoogleCalendars(startTime: Date, endTime: Date, googleCalendarIds: { id: string }[]) {
		const api = await this.googleApi.getCalendarApi();

		const params = {
			requestBody: {
				timeMin: startTime.toISOString(),
				timeMax: endTime.toISOString(),
				timeZone: CalendarTimezone,
				items: googleCalendarIds,
			},
		};
		const freeBusyResponse = await api.freebusy.query(params);

		return freeBusyResponse.data.calendars;
	}

	public async addCalendarUser(
		calendarId: string,
		user: { role: string; email: string },
	): Promise<CalendarUserModel> {
		const api = await this.googleApi.getCalendarApi();

		const params = {
			calendarId,
			requestBody: {
				role: user.role,
				scope: {
					type: 'user',
					value: user.email,
				},
			},
		};
		const response = await api.acl.insert(params);

		return {
			email: response.data.scope.value,
		} as CalendarUserModel;
	}

	public async createEvent(booking: Booking, calendarId: string): Promise<string> {
		const api = await this.googleApi.getCalendarApi();
		const params = {
			calendarId,
			requestBody: {
				summary: 'Booking SG Event',
				start: {
					dateTime: booking.startDateTime.toISOString(),
					timeZone: CalendarTimezone,
				},
				end: {
					dateTime: booking.endDateTime.toISOString(),
					timeZone: CalendarTimezone,
				},
			},
		};
		const event = await api.events.insert(params);
		return event.data.iCalUID;
	}

	public async deleteEvent(calendarId: string, eventId: string) {
		const api = await this.googleApi.getCalendarApi();
		const params = {
			calendarId,
			eventId,
		};
		await api.events.delete(params);
	}
}
