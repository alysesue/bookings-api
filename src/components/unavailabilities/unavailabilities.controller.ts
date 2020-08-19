import { Inject } from "typescript-ioc";
import { Body, Controller, Get, Header, Post, Query, Response, Route, Security, SuccessResponse, Tags, } from "tsoa";
import { UnavailabilitiesService } from "./unavailabilities.service";
import { UnavailabilityRequest, UnavailabilityResponse } from "./unavailabilities.apicontract";
import { Unavailability } from "../../models";
import { ServiceprovidersMapper } from "../serviceProviders/serviceProviders.mapper";
import { MOLAuth } from "mol-lib-common";

@Route("v1/unavailabilities")
@Tags('Unavailabilities')
export class UnavailabilitiesController extends Controller {
	@Inject
	private unavailabilitiesService: UnavailabilitiesService;
	@Inject
	private serviceprovidersMapper: ServiceprovidersMapper;

	private mapToResponse(data: Unavailability): UnavailabilityResponse {
		const serviceProviders = this.serviceprovidersMapper.mapSummaryDataModels(data.serviceProviders);
		return {
			startTime: data.start,
			endTime: data.end,
			allServiceProviders: data.allServiceProviders,
			serviceProviders
		} as UnavailabilityResponse;
	}

	/**
	 * Creates an unavailable (blocked) timeslot for a service or, optionally, for specific service providers.
	 * @param request
	 * @param serviceId The service id.
	 */
	@Post("")
	@Security("service")
	@SuccessResponse(201, "Created")
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async addUnavailability(@Body() request: UnavailabilityRequest, @Header("x-api-service") serviceId: number): Promise<UnavailabilityResponse> {
		request.serviceId = serviceId;
		const saved = await this.unavailabilitiesService.create(request);
		this.setStatus(201);
		return this.mapToResponse(saved);
	}

	@Get("")
	@Security("service")
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async getUnavailabilities(@Header('x-api-service') serviceId: number, @Query() fromDate: Date, @Query() toDate: Date, @Query() serviceProviderId?: number): Promise<UnavailabilityResponse[]> {
		const entries = await this.unavailabilitiesService.search({ from: fromDate, to: toDate, serviceId, serviceProviderId });
		return entries.map(e => this.mapToResponse(e));
	}
}
