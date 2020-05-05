import { Inject, Singleton } from 'typescript-ioc';
import { Calendar } from '../models/calendar';
import { CalendarsRepository } from './calendars.repository';
import { GoogleCalendarApiWrapper } from '../googleapi/calendarwrapper';
import { CalendarUserModel } from './calendars.apicontract';

@Singleton
export class CalendarsService {

	@Inject
	private calendarsRepository: CalendarsRepository;

	@Inject
	private apiWrapper: GoogleCalendarApiWrapper;

	public async getCalendars(): Promise<Calendar[]> {
		return await this.calendarsRepository.getCalendars();
	}

	public async createCalendar(): Promise<Calendar> {
		const api = await this.apiWrapper.getCalendarApi();

		const response = await api.calendars.insert({
			requestBody: {
				summary: 'Booking SG Calendar',
				timeZone: 'Asia/Singapore'
			}
		});

		const calendar = new Calendar();
		calendar.googleCalendarId = response.data.id;

		return await this.calendarsRepository.saveCalendar(calendar);
	}

	public async addUser(calendarUUID: string, model: CalendarUserModel): Promise<CalendarUserModel> {
		const calendar = await this.calendarsRepository.getCalendarByUUID(calendarUUID);

		const api = await this.apiWrapper.getCalendarApi();

		const response = await api.acl.insert({
			calendarId: calendar.googleCalendarId,
			requestBody: {
				role: "reader",
				scope: {
					type: "user",
					value: model.email
				}
			}
		});

		return {
			email: response.data.scope.value
		} as CalendarUserModel;
	}
}
