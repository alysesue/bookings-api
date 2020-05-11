import { logger } from 'mol-lib-common/debugging/logging/LoggerV2';
import { Inject } from 'typescript-ioc';

import { Body, Controller, Get, Path, Post, Route } from 'tsoa';
import { CalendarModel, CalendarUserModel } from './calendars.apicontract';
import { CalendarsService } from './calendars.service';
import { Calendar } from '../models/calendar';
import { CalDavProxyHandler } from '../infrastructure/caldavproxy.handler';

@Route('api/v1/calendars')
export class CalendarsController extends Controller {
	private static CalendarTimezone = 'Asia/Singapore';

	@Inject
	private calendarsService: CalendarsService;

	@Inject
	private proxyHandler: CalDavProxyHandler;

	private mapDataModel(calendar: Calendar): CalendarModel {
		return {
			uuid: calendar.uuid,
			externalCalendarUrl: calendar.generateExternalUrl(CalendarsController.CalendarTimezone),
			caldavUserUrl: calendar.generateCaldavUserUrl(this.proxyHandler.httpProtocol, this.proxyHandler.httpHost),
			caldavEventsUrl: calendar.generateCaldavEventsUrl(this.proxyHandler.httpProtocol, this.proxyHandler.httpHost)
		} as CalendarModel;
	}

	private mapDataModels(calendars: Calendar[]): CalendarModel[] {
		return calendars?.map(e => this.mapDataModel(e));
	}

	@Get('')
	public async getCalendars(): Promise<CalendarModel[]> {
		const dataModels = await this.calendarsService.getCalendars();
		return this.mapDataModels(dataModels);
	}

	@Post('')
	public async addCalendars(): Promise<CalendarModel> {
		const data = await this.calendarsService.createCalendar();
		return this.mapDataModel(data);
	}

	@Post('{calendarUUID}/useraccess')
	public async addUser(@Path() calendarUUID: string, @Body() model: CalendarUserModel): Promise<CalendarUserModel> {
		return await this.calendarsService.addUser(calendarUUID, model);
	}
}
