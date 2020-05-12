import { Inject } from "typescript-ioc";

import { Body, Controller, Get, Path, Post, Query, Route, SuccessResponse, Tags } from "tsoa";
import { AddCalendarModel, CalendarModel, CalendarUserModel, ServiceProviderResponse } from "./calendars.apicontract";
import { CalendarsService } from "./calendars.service";
import { BookingStatus, Calendar } from "../models";
import { CalDavProxyHandler } from "../infrastructure/caldavproxy.handler";
import { Constants } from "../models/constants";
import { BookingSearchRequest } from "../bookings/bookings.apicontract";
import { BookingsService } from "../bookings";

@Route("api/v1/calendars")
@Tags('Calendars')
export class CalendarsController extends Controller {
	@Inject
	private calendarsService: CalendarsService;

	@Inject
	private proxyHandler: CalDavProxyHandler;

	@Inject
	private bookingsService: BookingsService;

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

	private static mapToServiceProviderResponse(calendar: Calendar): ServiceProviderResponse {
		return {
			serviceProviderName: calendar.serviceProviderName,
			uuid: calendar.uuid
		} as ServiceProviderResponse;
	}

	@Get('availability')
	@SuccessResponse(200, "Ok")
	public async getAvailability(@Query() from: Date, @Query() to: Date): Promise<ServiceProviderResponse[]> {
		const calendars = await this.calendarsService.searchCalendars(from, to);
		const bookingRequests = await this.getBookingRequests(from, to);
		if (bookingRequests.length >= calendars.length) {
			return [];
		}
		return calendars.map(cal => CalendarsController.mapToServiceProviderResponse(cal));
	}

	private async getBookingRequests(from: Date, to: Date) {
		const searchBookingsRequest = new BookingSearchRequest(BookingStatus.PendingApproval, from, to);
		return await this.bookingsService.searchBookings(searchBookingsRequest);
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

	@Post("{calendarUUID}/useraccess")
	public async addUser(@Path() calendarUUID: string, @Body() model: CalendarUserModel): Promise<CalendarUserModel> {
		return await this.calendarsService.addUser(calendarUUID, model);
	}

	private mapDataModels(calendars: Calendar[]): CalendarModel[] {
		return calendars?.map(e => this.mapDataModel(e));
	}
}
