import { Inject } from "typescript-ioc";
import {
	CalendarModel,
	CalendarTemplatesTimeslotModel,
	CalendarTemplateTimeslotResponse,
	CalendarUserModel,
	ServiceProviderResponse
} from "./calendars.apicontract";
import { CalendarsService } from "./calendars.service";
import { Calendar } from "../models";
import { CalDavProxyHandler } from "../infrastructure/caldavproxy.handler";
import { Constants } from "../models/constants";
import { Body, Controller, Get, Path, Post, Put, Query, Route, SuccessResponse, Tags } from "tsoa";
import { TimeslotsService } from "../timeslots/timeslots.service";

@Route("**/v1/calendars")
@Tags('Calendars')
export class CalendarsController extends Controller {
	@Inject
	private calendarsService: CalendarsService;

	@Inject
	private proxyHandler: CalDavProxyHandler;

	@Inject
	private timeslotService: TimeslotsService;

	private static mapToServiceProviderResponse(calendar: Calendar): ServiceProviderResponse {
		return {
			uuid: calendar.uuid
		} as ServiceProviderResponse;
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

	@Get('availability')
	@SuccessResponse(200, "Ok")
	public async getAvailability(@Query() from: Date, @Query() to: Date): Promise<ServiceProviderResponse[]> {
		const calendars = await this.timeslotService.getAvailableCalendarsForTimeslot(from, to);

		return calendars.map(CalendarsController.mapToServiceProviderResponse);
	}

	private mapDataModel(calendar: Calendar): CalendarModel {
		return {
			uuid: calendar.uuid,
			externalCalendarUrl: calendar.generateExternalUrl(Constants.CalendarTimezone),
			caldavUserUrl: calendar.generateCaldavUserUrl(this.proxyHandler.httpProtocol, this.proxyHandler.httpHost),
			caldavEventsUrl: calendar.generateCaldavEventsUrl(this.proxyHandler.httpProtocol, this.proxyHandler.httpHost)
		} as CalendarModel;
	}

	private mapDataModels(calendars: Calendar[]): CalendarModel[] {
		return calendars?.map(e => this.mapDataModel(e));
	}
}
