import { Inject } from "typescript-ioc";
import { Controller, Get, Query, Route, Tags, } from "tsoa";
import { TimeslotResponse } from "./timeslots.apicontract";
import { TimeslotsService } from './timeslots.service';
import { DateHelper } from "../infrastructure/dateHelper";

@Route("**/v1/timeslots")
@Tags('Timeslots')
export class TimeslotsController extends Controller {
	@Inject
	private timeslotsService: TimeslotsService;

	@Get("availability")
	public async getAggregatedTimeslots(@Query() startDate: Date, @Query() endDate: Date): Promise<TimeslotResponse[]> {
		// Parameters are created as UTC datetimes, treating them as local datetimes
		startDate = DateHelper.UTCAsLocal(startDate);
		endDate = DateHelper.UTCAsLocal(endDate);

		const aggregated = await this.timeslotsService.getAggregatedTimeslots(startDate, endDate);
		return aggregated;
	}
}
