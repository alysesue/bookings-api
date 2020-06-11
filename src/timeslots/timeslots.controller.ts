import { Inject } from "typescript-ioc";
import { Controller, Get, Header, Query, Route, Security, Tags, } from "tsoa";
import { TimeslotResponse } from "./timeslots.apicontract";
import { AvailableTimeslotProviders, TimeslotsService } from './timeslots.service';
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

		let availableTimeslots = await this.timeslotsService.getAggregatedTimeslots(startDate, endDate, serviceId);
		availableTimeslots = availableTimeslots.filter(e => e.availabilityCount > 0);
		return TimeslotsController.mapToResponse(availableTimeslots);
	}

	private static mapToResponse(entries: AvailableTimeslotProviders[]): TimeslotResponse[] {
		return entries.map(e => this.mapEntryToResponse(e));
	}

	private static mapEntryToResponse(entry: AvailableTimeslotProviders): TimeslotResponse {
		const response = new TimeslotResponse();
		response.startTime = entry.startTime;
		response.endTime = entry.endTime;
		response.availabilityCount = entry.availabilityCount;
		return response;
	}
}
