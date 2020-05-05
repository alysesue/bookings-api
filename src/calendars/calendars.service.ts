import { Inject, Singleton } from 'typescript-ioc';
import { Calendar } from '../models/calendar';
import { CalendarsRepository } from './calendars.repository';
import {GoogleCalendarService} from '../googleapi/google.calendar.service';

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

	public async validateTimeSlot(startTime: Date, sessionDuration: number) {
		const calendars = await this.getCalendars();
		const endTime = CalendarsService.getSessionEndTime(startTime, sessionDuration);
		const availableCalendars = await this.getAvailableCalendarsForTimeSlot(startTime, endTime, calendars);

		if (CalendarsService.isEmptyArray(availableCalendars)) {
			throw new Error("No available calendars for this timeslot");
		}
	}

	public async getAvailableCalendarsForTimeSlot(startTime: Date, endTime: Date, calendars: Calendar[]) {
		const googleCalendarIds = calendars.map(cal => ({id: cal.googleCalendarId.toString()}));

		const availableGoogleCalendars =
			await this.googleCalendarApi.getAvailableGoogleCalendars(startTime, endTime, googleCalendarIds);

		return calendars.filter(calendar =>
			CalendarsService.isEmptyArray(availableGoogleCalendars[calendar.googleCalendarId].busy));
	}

	private static isEmptyArray(array) {
		return Array.isArray(array) && array.length;
	}

	private static getSessionEndTime(startTime: Date, sessionDuration: number) {
		return new Date(startTime.getTime() + sessionDuration * 60 * 1000);
	}
}
