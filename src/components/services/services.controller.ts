import { Inject } from 'typescript-ioc';
import { Body, Controller, Delete, Get, Path, Post, Put, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { ServiceRequest, ServiceResponse } from './service.apicontract';
import { ServicesService } from './services.service';
import { Service } from '../../models';
import { mapToResponse as mapSScheduleFormResponseToResponse } from '../scheduleForms/scheduleForms.mapper';
import { ScheduleFormRequest, ScheduleFormResponse } from '../scheduleForms/scheduleForms.apicontract';
import {
	TimeslotItemRequest,
	TimeslotItemResponse,
	TimeslotsScheduleResponse,
} from '../timeslotItems/timeslotItems.apicontract';
import { mapToTimeslotItemResponse, mapToTimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.mapper';
import { MOLAuth } from 'mol-lib-common';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { mapToLabelsResponse } from '../labels/labels.mapper';

@Route('v1/services')
@Tags('Services')
export class ServicesController extends Controller {
	@Inject
	private servicesService: ServicesService;

	private static mapToServiceResponse(service: Service) {
		const response = new ServiceResponse();
		response.id = service.id;
		response.name = service.name;
		response.isStandAlone = service.isStandAlone;
		response.labels = mapToLabelsResponse(service.labels);
		return response;
	}

	/**
	 * Creates a service for booking.
	 * @param request
	 */
	@Post()
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createService(@Body() request: ServiceRequest): Promise<ApiData<ServiceResponse>> {
		return ApiDataFactory.create(
			ServicesController.mapToServiceResponse(await this.servicesService.createService(request)),
		);
	}

	/**
	 * Update a single service.
	 * @param @isInt serviceId The service id.
	 * @param serviceRequest
	 */
	@Put('{serviceId}')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async updateService(
		serviceId: number,
		@Body() serviceRequest: ServiceRequest,
	): Promise<ApiData<ServiceResponse>> {
		const service = await this.servicesService.updateService(serviceId, serviceRequest);
		return ApiDataFactory.create(ServicesController.mapToServiceResponse(service));
	}
	/**
	 * Retrieves all services.
	 */
	@Get()
	@SuccessResponse(200, 'Ok')
	@MOLAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async getServices(): Promise<ApiData<ServiceResponse[]>> {
		const services = await this.servicesService.getServices();
		return ApiDataFactory.create(services.map(ServicesController.mapToServiceResponse));
	}

	@Put('{id}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async setServiceScheduleForm(
		@Path() id: number,
		@Body() request: ScheduleFormRequest,
	): Promise<ApiData<ScheduleFormResponse>> {
		return ApiDataFactory.create(
			mapSScheduleFormResponseToResponse(await this.servicesService.setServiceScheduleForm(id, request)),
		);
	}

	@Get('{id}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getServiceScheduleForm(@Path() id: number): Promise<ApiData<ScheduleFormResponse>> {
		return ApiDataFactory.create(
			mapSScheduleFormResponseToResponse(await this.servicesService.getServiceScheduleForm(id)),
		);
	}

	/**
	 * Retrieves a single service.
	 * @param @isInt serviceId The service id.
	 */
	@Get('{serviceId}')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async getService(serviceId: number): Promise<ApiData<ServiceResponse>> {
		const service = await this.servicesService.getService(serviceId);
		return ApiDataFactory.create(ServicesController.mapToServiceResponse(service));
	}

	/**
	 * Retrieves all weekly recurring timeslots for a service.
	 * @param @isInt serviceId The service id.
	 */
	@Get('{serviceId}/timeslotSchedule')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getTimeslotsScheduleByServiceId(serviceId: number): Promise<ApiData<TimeslotsScheduleResponse>> {
		const data = await this.servicesService.getServiceTimeslotsSchedule(serviceId);
		return ApiDataFactory.create(mapToTimeslotsScheduleResponse(data));
	}

	/**
	 * Creates a new weekly recurring timeslot for a service.
	 * @param @isInt serviceId The service id.
	 * @param request
	 */
	@Post('{serviceId}/timeslotSchedule/timeslots')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createTimeslotItem(
		@Path() serviceId: number,
		@Body() request: TimeslotItemRequest,
	): Promise<ApiData<TimeslotItemResponse>> {
		const data = await this.servicesService.addTimeslotItem(serviceId, request);
		this.setStatus(201);
		return ApiDataFactory.create(mapToTimeslotItemResponse(data));
	}

	/**
	 * Updates a weekly recurring timeslot. Existing bookings are not affected.
	 * @param @isInt serviceId The service id.
	 * @param @isInt timeslotId The weekly timeslot id.
	 * @param request
	 */
	@Put('{serviceId}/timeslotSchedule/timeslots/{timeslotId}')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async updateTimeslotItem(
		@Path() serviceId: number,
		@Path() timeslotId: number,
		@Body() request: TimeslotItemRequest,
	): Promise<ApiData<TimeslotItemResponse>> {
		const data = await this.servicesService.updateTimeslotItem({ serviceId, timeslotId, request });
		return ApiDataFactory.create(mapToTimeslotItemResponse(data));
	}

	/**
	 * Deletes a weekly recurring timeslot. Existing bookings are not affected.
	 * @param @isInt serviceId The service id.
	 * @param @isInt timeslotId The weekly timeslot id.
	 */
	@Delete('{serviceId}/timeslotSchedule/timeslots/{timeslotId}')
	@SuccessResponse(204, 'Deleted')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async deleteTimeslotItem(@Path() serviceId: number, @Path() timeslotId: number): Promise<void> {
		await this.servicesService.deleteTimeslotsScheduleItem(timeslotId);
	}
}
