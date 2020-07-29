import { Body, Controller, Delete, Deprecated, Get, Path, Post, Put, Route, SuccessResponse, Tags } from "tsoa";
import { ServiceRequest, ServiceResponse, SetScheduleRequest } from "./service.apicontract";
import { Inject } from "typescript-ioc";
import { ServicesService } from "./services.service";
import { Service } from "../models";
import { mapToResponse as mapScheduleToResponse } from '../schedules/schedules.mapper';
import { ScheduleResponse } from '../schedules/schedules.apicontract';
import { TimeslotItemsService } from "../timeslotItems/timeslotItems.service";
import { TimeslotItemRequest, TimeslotItemResponse, TimeslotsScheduleResponse } from "../timeslotItems/timeslotItems.apicontract";
import { mapToTimeslotItemResponse, mapToTimeslotsScheduleResponse } from "../timeslotItems/timeslotItems.mapper";

@Route('v1/services')
@Tags('Services')
export class ServicesController extends Controller {

	@Inject
	private servicesService: ServicesService;

	@Inject
	private timeslotItemsService: TimeslotItemsService;

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

	@Deprecated()
	@Put('{id}/schedule')
	@SuccessResponse(200, "Ok")
	public async setServiceSchedule(@Path() id: number, @Body() request: SetScheduleRequest): Promise<ScheduleResponse> {
		return mapScheduleToResponse(await this.servicesService.setServiceSchedule(id, request));
	}

	@Deprecated()
	@Get('{id}/schedule')
	@SuccessResponse(200, "Ok")
	public async getServiceSchedule(@Path() id: number): Promise<ScheduleResponse> {
		return mapScheduleToResponse(await this.servicesService.getServiceSchedule(id));
	}

	@Get("{serviceId}")
	@SuccessResponse(200, "Ok")
	public async getService(serviceId: number): Promise<ServiceResponse> {
		const service = await this.servicesService.getService(serviceId);
		return ServicesController.mapToServiceResponse(service);
	}

	@Get("{serviceId}/timeslotSchedule")
	@SuccessResponse(200, "Ok")
	public async getTimeslotsScheduleByServiceId(serviceId: number): Promise<TimeslotsScheduleResponse> {
		const data = await this.servicesService.getServiceTimeslotsSchedule(serviceId);
		return mapToTimeslotsScheduleResponse(data);
	}

	@Post("{serviceId}/timeslotSchedule/timeslots")
	@SuccessResponse(201, "Created")
	public async createTimeslotItem(@Path() serviceId: number, @Body() request: TimeslotItemRequest): Promise<TimeslotItemResponse> {
		const data = await this.servicesService.addTimeslotItem(serviceId, request);
		return mapToTimeslotItemResponse(data);
	}

	@Delete("{serviceId}/timeslotSchedule/timeslots/{timeslotId}")
	@SuccessResponse(204, "No Content")
	public async deleteTimeslotItem(@Path() serviceId: number, @Path() timeslotId: number) {
		await this.servicesService.deleteTimeslotsScheduleItem(timeslotId);
	}

	@Put("{serviceId}/timeslotSchedule/timeslots/{timeslotId}")
	@SuccessResponse(200, "Ok")
	public async updateTimeslotItem(@Path() serviceId: number, @Path() timeslotId: number, @Body() request: TimeslotItemRequest): Promise<TimeslotItemResponse> {
		const data = await this.servicesService.updateTimeslotItem({ serviceId, timeslotId, request });
		return mapToTimeslotItemResponse(data);
	}
}
