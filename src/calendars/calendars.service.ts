import { Inject, InRequestScope } from "typescript-ioc";
import { Booking, Calendar, Schedule } from "../models";
import { CalendarsRepository } from "./calendars.repository";
import { GoogleCalendarService } from "../googleapi/google.calendar.service";
import { CalendarTemplatesTimeslotModel, CalendarUserModel } from "./calendars.apicontract";
import { SchedulesRepository } from "../schedules/schedules.repository";
import { isEmptyArray } from "../tools/arrays";

@InRequestScope
export class CalendarsService {
	@Inject
	private schedulesRepository: SchedulesRepository;
	@Inject
	private calendarsRepository: CalendarsRepository;
	@Inject
	private googleCalendarApi: GoogleCalendarService;

	public async getCalendars(): Promise<Calendar[]> {
		return await this.calendarsRepository.getCalendars();
	}

	public async getCalendarByUUID(uuid: string): Promise<Calendar> {
		return await this.calendarsRepository.getCalendarByUUID(uuid);
	}

	public async createCalendar(): Promise<Calendar> {
		const googleCalendarId = await this.googleCalendarApi.createCalendar();
		const calendar = new Calendar();
		calendar.googleCalendarId = googleCalendarId;
		return await this.calendarsRepository.saveCalendar(calendar);
	}

	public async validateGoogleCalendarForTimeSlot(booking: Booking, calendar: Calendar) {
		const googleCalendarResult = await this.googleCalendarApi.getAvailableGoogleCalendars(
			booking.startDateTime,
			booking.getSessionEndTime(),
			[{ id: calendar.googleCalendarId }]
		);

		return isEmptyArray(googleCalendarResult[calendar.googleCalendarId].busy);
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

	public async addSchedules(calendarUUID: string, model: CalendarTemplatesTimeslotModel): Promise<Schedule> {
		const calendar = await this.calendarsRepository.getCalendarByUUID(calendarUUID);
		const schedule = await this.schedulesRepository.getScheduleById(model.templatesTimeslotId);
		calendar.schedule = schedule;
		await this.calendarsRepository.saveCalendar(calendar);
		return schedule;
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
