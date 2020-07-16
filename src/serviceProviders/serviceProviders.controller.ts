import { Inject, InRequestScope } from "typescript-ioc";
import { ServiceProviderListRequest, ServiceProviderModel, ServiceProviderResponseModel, SetProviderScheduleRequest } from "./serviceProviders.apicontract";
import { ServiceProvidersService } from "./serviceProviders.service";
import { Body, Controller, Get, Header, Path, Post, Put, Route, Security, SuccessResponse, Tags } from "tsoa";
import { ErrorResponse } from "../apicontract";
import { parseCsv } from "../utils";
import { mapToResponse as mapScheduleToResponse } from '../schedules/schedules.mapper';
import { ScheduleResponse } from "../schedules/schedules.apicontract";
import { ServiceprovidersMapper } from "./serviceProviders.mapper";
import { TimeslotsScheduleResponse } from "../timeslotItems/timeslotItems.apicontract";

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

	@Post("")
	@Security("service")
	@SuccessResponse(201, 'Created')
	public async addServiceProviders(@Body() spRequest: ServiceProviderListRequest, @Header('x-api-service') serviceId: number) {
		await this.serviceProvidersService.saveServiceProviders(spRequest.serviceProviders, serviceId);
	}

	@Post("/csv")
	@Security("service")
	@SuccessResponse(201, 'Created')
	public async addServiceProvidersText(@Body() spRequest: string, @Header('x-api-service') serviceId: number) {
		try {
			const request = ServiceProvidersController.parseCsvModelToServiceProviders(parseCsv(spRequest));
			await this.serviceProvidersService.saveServiceProviders(request, serviceId);
		} catch (e) {
			return new ErrorResponse(e.message);
		}
	}

	@Get("")
	@Security("optional-service")
	public async getServiceProviders(@Header('x-api-service') serviceId?: number): Promise<ServiceProviderResponseModel[]> {
		const dataModels = await this.serviceProvidersService.getServiceProviders(serviceId);
		return this.mapper.mapDataModels(dataModels);
	}

	@Get("{spId}")
	public async getServiceProvider(@Path() spId: number): Promise<ServiceProviderResponseModel> {
		const dataModel = await this.serviceProvidersService.getServiceProvider(spId);
		return this.mapper.mapDataModel(dataModel);
	}

	@Put('{id}/schedule')
	@SuccessResponse(200, "Ok")
	public async setServiceSchedule(@Path() id: number, @Body() request: SetProviderScheduleRequest): Promise<ScheduleResponse> {
		return mapScheduleToResponse(await this.serviceProvidersService.setProviderSchedule(id, request));
	}

	@Get('{id}/schedule')
	@SuccessResponse(200, "Ok")
	public async getServiceSchedule(@Path() id: number): Promise<ScheduleResponse> {
		return mapScheduleToResponse(await this.serviceProvidersService.getProviderSchedule(id));
	}

	@Get("{id}/timeslotSchedule")
	@SuccessResponse(200, "Ok")
	public async getTimeslotsScheduleByServiceProvider(id: number): Promise<TimeslotsScheduleResponse> {
		return await this.serviceProvidersService.getTimeslotItemsByServiceProviderId(id);
	}
}
