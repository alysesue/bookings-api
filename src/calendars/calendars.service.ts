import { Inject, Singleton } from "typescript-ioc";
import { Booking, Calendar, TemplateTimeslots } from "../models";
import { CalendarsRepository } from "./calendars.repository";
import { GoogleCalendarService } from "../googleapi/google.calendar.service";
import { AddCalendarModel, CalendarTemplatesTimeslotModel, CalendarUserModel } from "./calendars.apicontract";
import { TemplatesTimeslotsRepository } from "../components/templatesTimeslots/templatesTimeslots.repository";
import { isEmptyArray } from "../tools/arrays";

@Singleton
export class CalendarsService {
	@Inject
	private templatesTimeslotsRepository: TemplatesTimeslotsRepository;
	@Inject
	private calendarsRepository: CalendarsRepository;
	@Inject
	private googleCalendarApi: GoogleCalendarService;

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

		return isEmptyArray(googleCalendarResult[calendar.googleCalendarId].busy);
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

		return calendars.filter((calendar) => isEmptyArray(googleCalendars[calendar.googleCalendarId].busy));
	}

	public async createEvent(booking: Booking, calendarId: string): Promise<string> {
		const calendar = await this.getCalendarForBookingRequest(booking, calendarId);
		return await this.createCalendarEvent(booking, calendar);
	}

	public async createCalendarEvent(booking: Booking, calendar: Calendar): Promise<string> {
		return await this.googleCalendarApi.createEvent(booking, calendar.googleCalendarId);
	}

	public async addTemplatesTimeslots(calendarUUID: string, model: CalendarTemplatesTimeslotModel): Promise<TemplateTimeslots> {
		const calendar = await this.calendarsRepository.getCalendarByUUID(calendarUUID);
		const templateTimeslots = await this.templatesTimeslotsRepository.getTemplateTimeslotsById(model.templatesTimeslotId);
		calendar.templatesTimeslots = templateTimeslots;
		await this.calendarsRepository.saveCalendar(calendar);
		return templateTimeslots;
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

	public async getCalendarForBookingRequest(booking: Booking, calendarId: string): Promise<Calendar> {
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
