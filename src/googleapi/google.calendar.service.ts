import {Singleton} from "typescript-ioc";
import {calendar_v3, google} from "googleapis";
import {Booking} from "../models";

import {CalendarUserModel} from "../calendars/calendars.apicontract";

const credentials = require("../config/googleapi-credentials.json");

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

@Singleton
export class GoogleCalendarService {
	private static CalendarTimezone = "Asia/Singapore";
	private _authToken: any = null;

	public setToken(token) {
		this._authToken = token;
	}

	public async getCalendarApi(): Promise<calendar_v3.Calendar> {
		const token = await this.getAuthToken();
		return new calendar_v3.Calendar({auth: token});
	}

	public async createCalendar() {
		const api = await this.getCalendarApi();

		const calendarRequest = {
			requestBody: {
				summary: "Booking SG Calendar",
				timeZone: GoogleCalendarService.CalendarTimezone,
			},
		};
		const response = await api.calendars.insert(calendarRequest);

		return response.data.id;
	}

	public async getAvailableGoogleCalendars(
		startTime: Date,
		endTime: Date,
		googleCalendarIds: { id: string }[]
	) {
		const api = await this.getCalendarApi();

		const params = {
			requestBody: {
				timeMin: startTime.toISOString(),
				timeMax: endTime.toISOString(),
				timeZone: GoogleCalendarService.CalendarTimezone,
				items: googleCalendarIds,
			},
		};
		const freeBusyResponse = await api.freebusy.query(params);

		return freeBusyResponse.data.calendars;
	}

	public async addCalendarUser(
		calendarId: string,
		user: { role: string; email: string }
	): Promise<CalendarUserModel> {
		const api = await this.getCalendarApi();

		const params = {
			calendarId,
			requestBody: {
				role: user.role,
				scope: {
					type: "user",
					value: user.email,
				},
			},
		};
		const response = await api.acl.insert(params);

		return {
			email: response.data.scope.value,
		} as CalendarUserModel;
	}

	public async createEvent(
		booking: Booking,
		calendarId: string
	): Promise<string> {
		const api = await this.getCalendarApi();
		const params = {
			calendarId,
			requestBody: {
				summary: "Booking SG Event",
				start: {
					dateTime: booking.startDateTime.toISOString(),
					timeZone: GoogleCalendarService.CalendarTimezone,
				},
				end: {
					dateTime: booking.getSessionEndTime().toISOString(),
					timeZone: GoogleCalendarService.CalendarTimezone,
				},
			},
		};
		const event = await api.events.insert(params);
		return event.data.iCalUID;
	}

	private async getAuthToken(): Promise<any> {
		const {client_email, private_key} = credentials;

		if (this._authToken === null) {
			const newToken = new google.auth.JWT(
				client_email,
				null,
				private_key,
				SCOPES
			);

			await this.testAuthorization(newToken);
			this.setToken(newToken);
		}

		return this._authToken;
	}

	private async testAuthorization(token): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			token.authorize((err, _) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}
}
