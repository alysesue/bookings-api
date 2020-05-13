import { Inject } from "typescript-ioc";

import { Body, Controller, Get, Path, Post, Put, Route, Tags } from "tsoa";
import {
	AddCalendarModel,
	CalendarModel,
	CalendarTemplatesTimeslotModel, CalendarTemplateTimeslotResponse,
	CalendarUserModel
} from "./calendars.apicontract";
import { CalendarsService } from "./calendars.service";
import { Calendar } from "../models";
import { CalDavProxyHandler } from "../infrastructure/caldavproxy.handler";
import { Constants } from "../models/constants";

@Route("api/v1/calendars")
@Tags('Calendars')
export class CalendarsController extends Controller {
	@Inject
	private calendarsService: CalendarsService;

	@Inject
	private proxyHandler: CalDavProxyHandler;

	@Post("")
	public async addCalendars(@Body() model: AddCalendarModel): Promise<CalendarModel> {
		const data = await this.calendarsService.createCalendar(model);
		return this.mapDataModel(data);
	}

	@Get("")
	public async getCalendars(): Promise<CalendarModel[]> {
		const dataModels = await this.calendarsService.getCalendars();
		return this.mapDataModels(dataModels);
	}

	@Post("{calendarUUID}/useraccess")
	public async addUser(@Path() calendarUUID: string, @Body() model: CalendarUserModel): Promise<CalendarUserModel> {
		return await this.calendarsService.addUser(calendarUUID, model);
	}

	@Put("{calendarUUID}/templatestimeslot")
	public async addCalendar(@Path() calendarUUID: string, @Body() model: CalendarTemplatesTimeslotModel): Promise<CalendarTemplateTimeslotResponse> {
		const data = await this.calendarsService.addTemplatesTimeslots(calendarUUID, model);
		return new CalendarTemplateTimeslotResponse(data);
	}

	private mapDataModel(calendar: Calendar): CalendarModel {
		return {
			uuid: calendar.uuid,
			serviceProviderName: calendar.serviceProviderName,
			externalCalendarUrl: calendar.generateExternalUrl(Constants.CalendarTimezone),
			caldavUserUrl: calendar.generateCaldavUserUrl(this.proxyHandler.httpProtocol, this.proxyHandler.httpHost),
			caldavEventsUrl: calendar.generateCaldavEventsUrl(this.proxyHandler.httpProtocol, this.proxyHandler.httpHost)
		} as CalendarModel;
	}

	private mapDataModels(calendars: Calendar[]): CalendarModel[] {
		return calendars?.map(e => this.mapDataModel(e));
	}
}
