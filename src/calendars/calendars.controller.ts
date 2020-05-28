import { Inject } from "typescript-ioc";
import {
	AddCalendarModel,
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
			serviceProviderName: calendar.serviceProviderName,
			uuid: calendar.uuid
		} as ServiceProviderResponse;
	}

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

	@Put("{calendarUUID}/schedule")
	public async addCalendar(@Path() calendarUUID: string, @Body() model: CalendarTemplatesTimeslotModel): Promise<CalendarScheduleResponse> {
		const data = await this.calendarsService.addSchedules(calendarUUID, model);
		return new CalendarScheduleResponse(data);
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
