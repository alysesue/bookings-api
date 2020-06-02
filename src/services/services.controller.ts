import { Body, Controller, Get, Path, Post, Put, Route, SuccessResponse, Tags } from "tsoa";
import { ServiceRequest, ServiceResponse, SetScheduleRequest } from "./service.apicontract";
import { Inject } from "typescript-ioc";
import { ServicesService } from "./services.service";
import { Service } from "../models";
import { mapToResponse as mapScheduleToResponse } from '../schedules/schedules.mapper';
import { ScheduleResponse } from '../schedules/schedules.apicontract';

@Route('**/v1/services')
@Tags('Services')
export class ServicesController extends Controller {

	@Inject
	private servicesService: ServicesService;

	private static mapToServiceResponse(service: Service) {
		const response = new ServiceResponse();
		response.id = service.id;
		response.name = service.name;
		return response;
	}

	@Post()
	@SuccessResponse(201, "Created")
	public async createService(@Body() request: ServiceRequest): Promise<ServiceResponse> {
		return ServicesController.mapToServiceResponse(await this.servicesService.createService(request));
	}

	@Get()
	@SuccessResponse(200, "Ok")
	public async getServices(): Promise<ServiceResponse[]> {
		const services = await this.servicesService.getServices();
		return services.map(ServicesController.mapToServiceResponse);
	}

	@Put('{id}/schedule')
	@SuccessResponse(200, "Ok")
	public async setServiceSchedule(@Path() id: number, @Body() request: SetScheduleRequest): Promise<ScheduleResponse> {
		return mapScheduleToResponse(await this.servicesService.setServiceSchedule(id, request));
	}

	@Get('{id}/schedule')
	@SuccessResponse(200, "Ok")
	public async getServiceSchedule(@Path() id: number): Promise<ScheduleResponse> {
		return mapScheduleToResponse(await this.servicesService.getServiceSchedule(id));
	}
}
