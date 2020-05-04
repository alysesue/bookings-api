import { logger } from 'mol-lib-common/debugging/logging/LoggerV2';
import { Inject } from 'typescript-ioc';

import { Controller, Get, Post, Route } from 'tsoa';
import { CalendarModel } from './calendars.apicontract';
import { CalendarsService } from './calendars.service';
import { Calendar } from '../../models/calendar';

@Route('api/v1/calendars')
export class CalendarsController extends Controller {

	@Inject
	private calendarsService: CalendarsService;

	private mapDataModel(calendar: Calendar): CalendarModel {
		return {
			uuid: calendar.uuid
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
}
