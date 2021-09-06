import { Inject } from 'typescript-ioc';
import {
	Body,
	Controller,
	Delete,
	Get,
	Header,
	Path,
	Post,
	Query,
	Response,
	Route,
	Security,
	SuccessResponse,
	Tags,
} from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { UnavailabilitiesService } from './unavailabilities.service';
import {
	UnavailabilityRequestV1,
	UnavailabilityRequestV2,
	UnavailabilityResponseV1,
	UnavailabilityResponseV2,
} from './unavailabilities.apicontract';
import { UnavailabilitiesMapperV1, UnavailabilitiesMapperV2 } from './unavailabilities.mapper';
import { IdHasher } from '../../infrastructure/idHasher';

@Route('v1/unavailabilities')
@Tags('Unavailabilities')
export class UnavailabilitiesController extends Controller {
	@Inject
	private unavailabilitiesService: UnavailabilitiesService;

	@Inject
	private unavailabilitiesMapperV1: UnavailabilitiesMapperV1;

	/**
	 * Creates an unavailable (blocked) timeslot for a service or, optionally, for specific service providers.
	 *
	 * @param request
	 * @param @isInt serviceId The service id.
	 */
	@Post('')
	@Security('service')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async addUnavailability(
		@Body() request: UnavailabilityRequestV1,
		@Header('x-api-service') serviceId: number,
	): Promise<ApiData<UnavailabilityResponseV1>> {
		request.serviceId = serviceId;
		const saved = await this.unavailabilitiesService.create(request);
		this.setStatus(201);
		return ApiDataFactory.create(this.unavailabilitiesMapperV1.mapToResponse(saved));
	}

	/**
	 * Retrieves unavailabilities
	 *
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
	): Promise<ApiData<UnavailabilityResponseV1[]>> {
		const entries = await this.unavailabilitiesService.search({
			from: fromDate,
			to: toDate,
			serviceId,
			serviceProviderId,
		});
		return ApiDataFactory.create(entries.map((e) => this.unavailabilitiesMapperV1.mapToResponse(e)));
	}

	/**
	 * Deletes an unavailability for a service provider
	 *
	 * @param id The ID of the unavailability.
	 */
	@Delete('{id}')
	@SuccessResponse(204, 'Deleted')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async deleteUnavailability(@Path() id: number): Promise<void> {
		await this.unavailabilitiesService.deleteUnavailability(id);
	}
}

@Route('v2/unavailabilities')
@Tags('Unavailabilities')
export class UnavailabilitiesControllerV2 extends Controller {
	@Inject
	private unavailabilitiesService: UnavailabilitiesService;

	@Inject
	private unavailabilitiesMapperV2: UnavailabilitiesMapperV2;

	@Inject
	private idHasher: IdHasher;

	/**
	 * Creates an unavailable (blocked) timeslot for a service or, optionally, for specific service providers.
	 *
	 * @param request
	 * @param serviceId The service id.
	 */
	@Post('')
	@Security('service')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async addUnavailability(
		@Body() request: UnavailabilityRequestV2,
		@Header('x-api-service') serviceId: string,
	): Promise<ApiData<UnavailabilityResponseV2>> {
		request.serviceId = serviceId;
		const unsignedServiceId = this.idHasher.decode(request.serviceId);
		const unsignedServiceProviderIds: number[] = [];
		for (const spId of request.serviceProviderIds) {
			unsignedServiceProviderIds.push(this.idHasher.decode(spId));
		}
		const requestData = {
			...request,
			serviceId: unsignedServiceId,
			serviceProviderIds: unsignedServiceProviderIds,
		};
		const saved = await this.unavailabilitiesService.create(requestData);
		this.setStatus(201);
		return ApiDataFactory.create(this.unavailabilitiesMapperV2.mapToResponse(saved));
	}

	/**
	 * Retrieves unavailabilities
	 *
	 * @param serviceId The service id.
	 * @param fromDate The lower bound datetime limit (inclusive) for unavailability's end time.
	 * @param toDate The upper bound datetime limit (inclusive) for unavailability's start time.
	 * @param serviceProviderId (Optional) Filters unavailabilities for a specific service provider.
	 */
	@Get('')
	@Security('service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getUnavailabilities(
		@Header('x-api-service') serviceId: string,
		@Query() fromDate: Date,
		@Query() toDate: Date,
		@Query() serviceProviderId?: string,
	): Promise<ApiData<UnavailabilityResponseV2[]>> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		const unsignedServiceProviderId = this.idHasher.decode(serviceProviderId);
		const entries = await this.unavailabilitiesService.search({
			from: fromDate,
			to: toDate,
			serviceId: unsignedServiceId,
			serviceProviderId: unsignedServiceProviderId,
		});
		return ApiDataFactory.create(entries.map((e) => this.unavailabilitiesMapperV2.mapToResponse(e)));
	}

	/**
	 * Deletes an unavailability for a service provider
	 *
	 * @param id The ID of the unavailability.
	 */
	@Delete('{id}')
	@SuccessResponse(204, 'Deleted')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async deleteUnavailability(@Path() id: string): Promise<void> {
		const unsignedUnavilabilityId = this.idHasher.decode(id);
		await this.unavailabilitiesService.deleteUnavailability(unsignedUnavilabilityId);
	}
}
