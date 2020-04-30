import { logger } from 'mol-lib-common/debugging/logging/LoggerV2';
import { Inject } from 'typescript-ioc';

import { Controller, Get, Post, Route } from 'tsoa';
import { CalendarModel } from './calendars.apicontract';
import { CalendarsService } from './calendars.service';
import { Calendar } from '../entities/calendar';

@Route('api/v1/calendars')
export class CalendarsController extends Controller {

	@Inject
	private calendarsService: CalendarsService;

	private mapDataModel(calendar: Calendar): CalendarModel {
		return {
			uuid: calendar.uuid
		} as CalendarModel;
	}

	private mapDataModels(calendar: Calendar[]): CalendarModel[] {
		if (calendar === null)
			return null;
		if (calendar.length === 0)
			return [];

		return calendar.map(e => this.mapDataModel(e));
	}

	@Get('')
	public async getCalendars(): Promise<CalendarModel[]> {
		try {
			const dataModels = await this.calendarsService.getCalendars();
			return this.mapDataModels(dataModels);
		} catch (err) {
			logger.error('endpointGetUsers:: error: ', err);
			throw err;
		}
	}

	@Post('')
	public async addCalendars(): Promise<CalendarModel> {
		try {
			const data = await this.calendarsService.createCalendar();
			return this.mapDataModel(data);
		} catch (err) {
			logger.error('endpointGetUsers:: error: ', err);
			throw err;
		}
	}
}
