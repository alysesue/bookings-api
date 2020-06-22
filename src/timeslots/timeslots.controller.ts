import { Inject } from "typescript-ioc";
import { Controller, Get, Header, Query, Route, Security, Tags, } from "tsoa";
import { AvailabilityEntryResponse, TimeslotEntryResponse } from "./timeslots.apicontract";
import { AvailableTimeslotProviders, TimeslotsService } from './timeslots.service';
import { ServiceprovidersMapper } from "../serviceProviders/serviceProviders.mapper";

@Route("v1/timeslots")
@Tags('Timeslots')
export class TimeslotsController extends Controller {
	@Inject
	private timeslotsService: TimeslotsService;

	@Inject
	private serviceProviderMapper: ServiceprovidersMapper;

	@Get("availability")
	@Security("service")
	public async getAvailability(@Query() startDate: Date, @Query() endDate: Date, @Header('x-api-service') serviceId: number): Promise<AvailabilityEntryResponse[]> {
		let availableTimeslots = await this.timeslotsService.getAggregatedTimeslots(startDate, endDate, serviceId);
		availableTimeslots = availableTimeslots.filter(e => e.availabilityCount > 0);
		return TimeslotsController.mapAvailabilityToResponse(availableTimeslots);
	}

	@Get("")
	@Security("service")
	public async getTimeslots(@Query() startDate: Date, @Query() endDate: Date, @Header('x-api-service') serviceId: number): Promise<AvailabilityEntryResponse[]> {
		const timeslots = await this.timeslotsService.getAggregatedTimeslots(startDate, endDate, serviceId);

		// todo: Map to TimeslotEntryResponse
		return TimeslotsController.mapAvailabilityToResponse(timeslots);
	}

	private static mapAvailabilityToResponse(entries: AvailableTimeslotProviders[]): AvailabilityEntryResponse[] {
		return entries.map(e => this.mapAvailabilityEntry(e));
	}

	private static mapAvailabilityEntry(entry: AvailableTimeslotProviders): AvailabilityEntryResponse {
		const response = new AvailabilityEntryResponse();
		response.startTime = entry.startTime;
		response.endTime = entry.endTime;
		response.availabilityCount = entry.availabilityCount;
		return response;
	}

	private static mapTimeslotEntry(entry: AvailableTimeslotProviders): TimeslotEntryResponse {
		const response = new TimeslotEntryResponse();
		response.startTime = entry.startTime;
		response.endTime = entry.endTime;
		// response.bookedServiceProviders = entry.bookedServiceProviders

		return response;
	}
}
