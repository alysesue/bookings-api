import { Inject } from 'typescript-ioc';
import { Body, Controller, Get, Header, Post, Query, Response, Route, Security, SuccessResponse, Tags } from 'tsoa';
import { UnavailabilitiesService } from './unavailabilities.service';
import { UnavailabilityRequest, UnavailabilityResponse } from './unavailabilities.apicontract';
import { Unavailability } from '../../models';
import { ServiceProvidersMapper } from '../serviceProviders/serviceProviders.mapper';
import { MOLAuth } from 'mol-lib-common';
import { ApiData, ApiDataFactory } from '../../apicontract';

@Route('v1/unavailabilities')
@Tags('Unavailabilities')
export class UnavailabilitiesController extends Controller {
	@Inject
	private unavailabilitiesService: UnavailabilitiesService;
	@Inject
	private serviceProvidersMapper: ServiceProvidersMapper;

	private mapToResponse(data: Unavailability): UnavailabilityResponse {
		const serviceProviders = this.serviceProvidersMapper.mapSummaryDataModels(data.serviceProviders);
		return {
			startTime: data.start,
			endTime: data.end,
			allServiceProviders: data.allServiceProviders,
			serviceProviders,
		} as UnavailabilityResponse;
	}

	/**
	 * Creates an unavailable (blocked) timeslot for a service or, optionally, for specific service providers.
	 * @param request
	 * @param @isInt serviceId The service id.
	 */
	@Post('')
	@Security('service')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async addUnavailability(
		@Body() request: UnavailabilityRequest,
		@Header('x-api-service') serviceId: number,
	): Promise<ApiData<UnavailabilityResponse>> {
		request.serviceId = serviceId;
		const saved = await this.unavailabilitiesService.create(request);
		this.setStatus(201);
		return ApiDataFactory.create(this.mapToResponse(saved));
	}

	/**
	 * Retrieves unavailabilities
	 * @param @isInt serviceId The service id.
	 * @param fromDate The lower bound datetime limit (inclusive) for unavailability's end time.
	 * @param toDate The upper bound datetime limit (inclusive) for unavailability's start time.
	 * @param @isInt serviceProviderId (Optional) Filters unavailabilities for a specific service provider.
	 */
	@Get('')
	@Security('service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getUnavailabilities(
		@Header('x-api-service') serviceId: number,
		@Query() fromDate: Date,
		@Query() toDate: Date,
		@Query() serviceProviderId?: number,
	): Promise<ApiData<UnavailabilityResponse[]>> {
		const entries = await this.unavailabilitiesService.search({
			from: fromDate,
			to: toDate,
			serviceId,
			serviceProviderId,
		});
		return ApiDataFactory.create(entries.map((e) => this.mapToResponse(e)));
	}
}
