import { logger } from 'mol-lib-common/debugging/logging/LoggerV2';
import { Inject } from 'typescript-ioc';

import { Body, Controller, Get, Path, Post, Route } from 'tsoa';
import { AddCalendarModel, CalendarModel, CalendarUserModel } from './calendars.apicontract';
import { CalendarsService } from './calendars.service';
import { Calendar } from '../models/calendar';

@Route('api/v1/calendars')
export class CalendarsController extends Controller {

	@Inject
	private calendarsService: CalendarsService;

	private mapDataModel(calendar: Calendar): CalendarModel {
		return {
			uuid: calendar.uuid,
			serviceProviderName: calendar.serviceProviderName,
			externalCalendarUrl: calendar.generateExternalUrl('Asia/Singapore')
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
	public async addCalendars(@Body() model: AddCalendarModel): Promise<CalendarModel> {
		const data = await this.calendarsService.createCalendar(model);
		return this.mapDataModel(data);
	}

	@Post('{calendarUUID}/useraccess')
	public async addUser(@Path() calendarUUID: string, @Body() model: CalendarUserModel): Promise<CalendarUserModel> {
		return await this.calendarsService.addUser(calendarUUID, model);
	}
}
