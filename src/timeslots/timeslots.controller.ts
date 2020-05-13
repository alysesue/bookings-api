import { Inject } from "typescript-ioc";
import { Body, Controller, Get, Path, Post, Query, Route, Tags, } from "tsoa";
import { TimeslotResponse } from "./timeslots.apicontract";
import { TimeslotsService } from './timeslots.service';
import { AggregatedEntry } from "./timeslotAggregator";
import { Calendar } from '../models/calendar';

@Route("api/v1/timeslots")
@Tags('Timeslots')
export class TimeslotsController extends Controller {
	@Inject
	private timeslotsService: TimeslotsService;

	@Get("aggregated")
	public async getAggregatedTimeslots(@Query() startDate: Date, @Query() endDate: Date): Promise<TimeslotResponse[]> {
		const aggregated = await this.timeslotsService.getAggregatedTimeslots(startDate, endDate);
		return this.mapDataModels(aggregated);
	}

	private mapDataModel(entry: AggregatedEntry<Calendar>): TimeslotResponse {
		return {
			startTime: entry.getTimeslot().getStartTime(),
			endTime: entry.getTimeslot().getEndTime(),
			availabilityCount: entry.getGroups().length
		} as TimeslotResponse;
	}

	private mapDataModels(entries: AggregatedEntry<Calendar>[]): TimeslotResponse[] {
		return entries?.map(e => this.mapDataModel(e));
	}
}
