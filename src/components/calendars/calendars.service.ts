import { Inject, Singleton } from 'typescript-ioc';
import { Calendar } from '../../models/calendar';
import { CalendarsRepository } from './calendars.repository';
import { GoogleCalendarApiWrapper } from '../../googleapi/calendarwrapper';

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
		const wrapper = new GoogleCalendarApiWrapper();
		const api = await wrapper.getCalendarApi();

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
}
