import { Inject } from "typescript-ioc";
import { Body, Controller, Get, Header, Post, Query, Route, Security, Tags, } from "tsoa";
import { UnavailabilitiesService } from "./unavailabilities.service";
import { UnavailabilityRequest, UnavailabilityResponse } from "./unavailabilities.apicontract";

@Route("v1/unavailabilities")
@Tags('Unavailabilities')
export class UnavailabilitiesController extends Controller {
	@Inject
	private unavailabilitiesService: UnavailabilitiesService;

	@Post("")
	@Security("service")
	public async addEntry(@Body() request: UnavailabilityRequest, @Header("x-api-service") serviceId: number): Promise<UnavailabilityResponse[]> {
		request.serviceId = serviceId;
		return null;
	}

	// @Get("")
	// @Security("service")
	// public async getEntries(@Query() startDate: Date, @Query() endDate: Date, @Header('x-api-service') serviceId: number): Promise<UnavailabilityResponse[]> {
	// 	return null;
	// }
}
