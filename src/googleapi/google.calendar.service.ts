import { Singleton } from "typescript-ioc";
import { calendar_v3, google, GoogleApis } from "googleapis";
import { JWT } from "google-auth-library";

const credentials = require('../config/googleapi-credentials.json');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

@Singleton
export class GoogleCalendarService {
	private _authToken: any = null;

	private static CalendarTimezone = 'Asia/Singapore';

	public setToken(token) {
		this._authToken = token;
	}

	private async loadJWTTokenFromFile(): Promise<JWT> {
		const newToken = new JWT();
		newToken.fromJSON(credentials);

		return newToken.createScoped(SCOPES);
	}

	private async getAuthToken(): Promise<JWT> {
		if (this._authToken === null) {
			const newToken = await this.loadJWTTokenFromFile();

			await newToken.authorize();
			this.setToken(newToken);
		}

		return this._authToken;
	}

	public async getAccessToken(): Promise<string> {
		const jwt = await this.getAuthToken();
		return (await jwt.getAccessToken()).token;
	}

	public async getCalendarApi(): Promise<calendar_v3.Calendar> {
		const token = await this.getAuthToken();
		return new calendar_v3.Calendar({ auth: token });
	}

	public async createCalendar() {
		const api = await this.getCalendarApi();

		const response = await api.calendars.insert({
			requestBody: {
				summary: 'Booking SG Calendar',
				timeZone: GoogleCalendarService.CalendarTimezone
			}
		});

		return response.data.id;
	}

	public async getAvailableGoogleCalendars(startTime: Date, endTime: Date, googleCalendarIds: { id: string }[]) {
		const api = await this.getCalendarApi();

		const freeBusyResponse = await api.freebusy.query({
			requestBody: {
				timeMin: startTime.toISOString(),
				timeMax: endTime.toISOString(),
				timeZone: GoogleCalendarService.CalendarTimezone,
				items: googleCalendarIds,
			}
		});

		return freeBusyResponse.data.calendars;
	}

	public async addCalendarUser(calendarId: string, user: { role: string, email: string }): Promise<string> {
		const api = await this.getCalendarApi();

		const response = await api.acl.insert({
			calendarId,
			requestBody: {
				role: user.role,
				scope: {
					type: "user",
					value: user.email
				}
			}
		});

		return response.data.scope.value;
	}
}
