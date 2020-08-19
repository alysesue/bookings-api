import { Inject, InRequestScope } from "typescript-ioc";
import { ServiceProviderListRequest, ServiceProviderModel, ServiceProviderResponseModel, SetProviderScheduleRequest } from "./serviceProviders.apicontract";
import { ServiceProvidersService } from "./serviceProviders.service";
import { Body, Controller, Delete, Deprecated, Get, Header, Path, Post, Put, Query, Route, Security, SuccessResponse, Tags } from "tsoa";
import { parseCsv } from "../../utils";
import { mapToResponse as mapScheduleToResponse } from '../schedules/schedules.mapper';
import { ScheduleResponse } from "../schedules/schedules.apicontract";
import { ServiceprovidersMapper } from "./serviceProviders.mapper";
import {
	TimeslotItemRequest,
	TimeslotItemResponse,
	TimeslotsScheduleResponse
} from "../timeslotItems/timeslotItems.apicontract";
import { mapToTimeslotItemResponse, mapToTimeslotsScheduleResponse } from "../timeslotItems/timeslotItems.mapper";

@InRequestScope
@Route("v1/service-providers")
@Tags('Service Providers')
export class ServiceProvidersController extends Controller {

	@Inject
	private serviceProvidersService: ServiceProvidersService;

	@Inject
	private mapper: ServiceprovidersMapper;

	// TODO: write test for this one
	private static parseCsvModelToServiceProviders(csvModels: []) {
		try {

			const serviceProvidersRequest = csvModels as ServiceProviderModel[];

			if (serviceProvidersRequest.length !== csvModels.length) {
				throw new Error("Invalid model format");
			}
			return serviceProvidersRequest;
		} catch (e) {
			throw new Error("Invalid model format");
		}
	}

	/**
	 * Creates multiple service providers (json format).
	 * @param spRequest
	 * @param serviceId The service id.
	 */
	@Post("")
	@Security("service")
	@SuccessResponse(204, 'Created')
	public async addServiceProviders(@Body() spRequest: ServiceProviderListRequest, @Header('x-api-service') serviceId: number) {
		await this.serviceProvidersService.saveServiceProviders(spRequest.serviceProviders, serviceId);
	}

	/**
	 * Creates multiple service providers (CSV format). The csv content must contain a single header called name.
	 * @param spRequest
	 * @param serviceId The service id.
	 */
	@Post("/csv")
	@Security("service")
	@SuccessResponse(204, 'Created')
	public async addServiceProvidersText(@Body() spRequest: string, @Header('x-api-service') serviceId: number) {
		const request = ServiceProvidersController.parseCsvModelToServiceProviders(parseCsv(spRequest));
		await this.serviceProvidersService.saveServiceProviders(request, serviceId);
	}

	/**
	 * Retrieves service providers.
	 * @param serviceId (Optional) Filters by a service (id).
	 * @param includeTimeslotsSchedule (Optional) Whether to include weekly timeslots in the response.
	 */
	@Get("")
	@Security("optional-service")
	public async getServiceProviders(@Header('x-api-service') serviceId?: number, @Query() includeTimeslotsSchedule = false): Promise<ServiceProviderResponseModel[]> {
		const dataModels = await this.serviceProvidersService.getServiceProviders(serviceId, undefined, includeTimeslotsSchedule);
		return this.mapper.mapDataModels(dataModels);
	}

	/**
	 * Retrieves a single service provider.
	 * @param spId The service provider id.
	 */
	@Get("{spId}")
	public async getServiceProvider(@Path() spId: number): Promise<ServiceProviderResponseModel> {
		const dataModel = await this.serviceProvidersService.getServiceProvider(spId, true, true);
		return this.mapper.mapDataModel(dataModel);
	}


	/**
	 * Updates a single service provider.
	 * @param spId The service provider id.
	 * @param spRequest
	 */
	@Put("{spId}")
	public async updateServiceProvider(@Path() spId: number, @Body() spRequest: ServiceProviderModel): Promise<ServiceProviderResponseModel> {
		const result = await this.serviceProvidersService.updateSp(spRequest, spId);
		return this.mapper.mapDataModel(result);
	}

	@Deprecated()
	@Put('{spId}/schedule')
	@SuccessResponse(200, "Ok")
	public async setServiceSchedule(@Path() spId: number, @Body() request: SetProviderScheduleRequest): Promise<ScheduleResponse> {
		return mapScheduleToResponse(await this.serviceProvidersService.setProviderSchedule(spId, request));
	}

	@Deprecated()
	@Get('{spId}/schedule')
	@SuccessResponse(200, "Ok")
	public async getServiceSchedule(@Path() spId: number): Promise<ScheduleResponse> {
		return mapScheduleToResponse(await this.serviceProvidersService.getProviderSchedule(spId));
	}

	/**
	 * Retrieves all weekly recurring timeslots for a service provider.
	 * @param spId The service provider id.
	 */
	@Get("{spId}/timeslotSchedule")
	@SuccessResponse(200, "Ok")
	public async getTimeslotsScheduleByServiceProviderId(@Path() spId: number): Promise<TimeslotsScheduleResponse> {
		const data = await this.serviceProvidersService.getTimeslotItems(spId);
		return mapToTimeslotsScheduleResponse(data);
	}

	/**
	 * Creates a new weekly recurring timeslot for a service provider.
	 * @param spId The service provider id.
	 * @param request
	 */
	@Post("{spId}/timeslotSchedule/timeslots")
	@SuccessResponse(201, "Created")
	public async createTimeslotItem(@Path() spId: number, @Body() request: TimeslotItemRequest): Promise<TimeslotItemResponse> {
		const data = await this.serviceProvidersService.addTimeslotItem(spId, request);
		this.setStatus(201);
		return mapToTimeslotItemResponse(data);
	}

	/**
	 * Updates a weekly recurring timeslot for a service provider. Existing bookings are not affected.
	 * @param spId The service provider id.
	 * @param timeslotId The weekly timeslot id.
	 * @param request
	 */
	@Put("{spId}/timeslotSchedule/timeslots/{timeslotId}")
	@SuccessResponse(200, "Ok")
	public async updateTimeslotItem(@Path() spId: number, @Path() timeslotId: number, @Body() request: TimeslotItemRequest): Promise<TimeslotItemResponse> {
		const data = await this.serviceProvidersService.updateTimeslotItem(spId, timeslotId, request);
		return mapToTimeslotItemResponse(data);
	}

	/**
	 * Deletes a weekly recurring timeslot for a service provider. Existing bookings are not affected.
	 * @param spId The service provider id.
	 * @param timeslotId The weekly timeslot id.
	 */
	@Delete("{spId}/timeslotSchedule/timeslots/{timeslotId}")
	@SuccessResponse(204, "No Content")
	public async deleteTimeslotItem(@Path() spId: number, @Path() timeslotId: number) {
		await this.serviceProvidersService.deleteTimeslotItem(spId, timeslotId);
	}
}
