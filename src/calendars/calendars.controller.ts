import { Inject } from "typescript-ioc";
import {
	CalendarModel,
	CalendarScheduleResponse,
	CalendarTemplatesTimeslotModel,
	CalendarUserModel,
	ServiceProviderResponse
} from "./calendars.apicontract";
import { CalendarsService } from "./calendars.service";
import { Calendar } from "../models";
import { CalDavProxyHandler } from "../infrastructure/caldavproxy.handler";
import { Constants } from "../models/constants";
import { Body, Controller, Get, Header, Path, Post, Put, Query, Route, Security, SuccessResponse, Tags } from "tsoa";
import { TimeslotsService } from "../timeslots/timeslots.service";

@Route("v1/calendars")
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

	@Get()
	@Security("service")
	public async getCalendars(@Header("x-api-service") _?: number): Promise<CalendarModel[]> {
		const dataModels = await this.calendarsService.getCalendars();
		return this.mapDataModels(dataModels);
	}

	@Post("{calendarUUID}/useraccess")
	@Security("service")
	public async addUser(@Path() calendarUUID: string, @Body() model: CalendarUserModel, @Header("x-api-service") _?: number): Promise<CalendarUserModel> {
		return await this.calendarsService.addUser(calendarUUID, model);
	}

	@Put("{calendarUUID}/schedule")
	@Security("service")
	public async addCalendar(@Path() calendarUUID: string, @Body() model: CalendarTemplatesTimeslotModel, @Header("x-api-service") _?): Promise<CalendarScheduleResponse> {
		const data = await this.calendarsService.addSchedules(calendarUUID, model);
		return new CalendarScheduleResponse(data);
	}

	@Get('availability')
	@SuccessResponse(200, "Ok")
	@Security("service")
	public async getAvailability(@Query() from: Date, @Query() to: Date, @Header("x-api-service") _?: number): Promise<ServiceProviderResponse[]> {
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
