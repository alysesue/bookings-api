import { Inject } from "typescript-ioc";

import { Body, Controller, Get, Path, Post, Query, Route, Tags, } from "tsoa";
import { TimeslotResponse } from "./timeslots.apicontract";
import { TimeslotsService } from './timeslots.service';

@Route("api/v1/timeslots")
@Tags('Calendars')
export class CalendarsController extends Controller {
	@Inject
	private timeslotsService: TimeslotsService;

	@Get("aggregated")
	public async getAggregatedTimeslots(@Query() startDate: Date, @Query() endDate: Date): Promise<TimeslotResponse[]> {
		const aggregated = await this.timeslotsService.getAggregatedTimeslots(startDate, endDate);

		throw new Error('Not implemented');
	}
}
