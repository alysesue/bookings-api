import { Inject } from "typescript-ioc";
import { Controller, Get, Header, Query, Route, Security, Tags, } from "tsoa";
import { TimeslotResponse } from "./timeslots.apicontract";
import { TimeslotsService } from './timeslots.service';
import { DateHelper } from "../infrastructure/dateHelper";

@Route("v1/timeslots")
@Tags('Timeslots')
export class TimeslotsController extends Controller {
	@Inject
	private timeslotsService: TimeslotsService;

	@Get("availability")
	@Security("service")
	public async getAggregatedTimeslots(@Query() startDate: Date, @Query() endDate: Date, @Header('x-api-service') serviceId: number): Promise<TimeslotResponse[]> {
		// Parameters are created as UTC datetimes, treating them as local datetimes
		startDate = DateHelper.UTCAsLocal(startDate);
		endDate = DateHelper.UTCAsLocal(endDate);

		return await this.timeslotsService.getAggregatedTimeslots(startDate, endDate, serviceId);
	}
}
