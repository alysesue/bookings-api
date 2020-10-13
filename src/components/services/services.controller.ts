import { Inject } from 'typescript-ioc';
import {
	Body,
	Controller,
	Delete,
	Deprecated,
	Get,
	Path,
	Post,
	Put,
	Response,
	Route,
	SuccessResponse,
	Tags,
} from 'tsoa';
import { ServiceRequest, ServiceResponse, SetScheduleFormRequest } from './service.apicontract';
import { ServicesService } from './services.service';
import { Service } from '../../models';
import { mapToResponse as mapSScheduleFormResponseToResponse } from '../scheduleForms/scheduleForms.mapper';
import { ScheduleFormResponse } from '../scheduleForms/scheduleForms.apicontract';
import {
	TimeslotItemRequest,
	TimeslotItemResponse,
	TimeslotsScheduleResponse,
} from '../timeslotItems/timeslotItems.apicontract';
import { mapToTimeslotItemResponse, mapToTimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.mapper';
import { MOLAuth } from 'mol-lib-common';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel';

@Route('v1/services')
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

	/**
	 * Creates a service for booking.
	 * @param request
	 */
	@Post()
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createService(@Body() request: ServiceRequest): Promise<ServiceResponse> {
		return ServicesController.mapToServiceResponse(await this.servicesService.createService(request));
	}

	/**
	 * Update a single service.
	 * @param serviceId The service id.
	 * @param serviceRequest
	 */
	@Put('{serviceId}')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async updateService(serviceId: number, @Body() serviceRequest: ServiceRequest): Promise<ServiceResponse> {
		const service = await this.servicesService.updateService(serviceId, serviceRequest);
		return ServicesController.mapToServiceResponse(service);
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
	public async getServices(): Promise<ServiceResponse[]> {
		const services = await this.servicesService.getServices();
		return services.map(ServicesController.mapToServiceResponse);
	}

	@Deprecated()
	@Put('{id}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async setServiceScheduleForm(
		@Path() id: number,
		@Body() request: SetScheduleFormRequest,
	): Promise<ScheduleFormResponse> {
		return mapSScheduleFormResponseToResponse(await this.servicesService.setServiceScheduleForm(id, request));
	}

	@Deprecated()
	@Get('{id}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getServiceScheduleForm(@Path() id: number): Promise<ScheduleFormResponse> {
		return mapSScheduleFormResponseToResponse(await this.servicesService.getServiceScheduleForm(id));
	}

	/**
	 * Retrieves a single service.
	 * @param serviceId The service id.
	 */
	@Get('{serviceId}')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async getService(serviceId: number): Promise<ServiceResponse> {
		const service = await this.servicesService.getService(serviceId);
		return ServicesController.mapToServiceResponse(service);
	}

	/**
	 * Retrieves all weekly recurring timeslots for a service.
	 * @param serviceId The service id.
	 */
	@Get('{serviceId}/timeslotSchedule')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getTimeslotsScheduleByServiceId(serviceId: number): Promise<TimeslotsScheduleResponse> {
		const data = await this.servicesService.getServiceTimeslotsSchedule(serviceId);
		console.log(data);
		console.log(data.timeslotItems);
		return mapToTimeslotsScheduleResponse(data);
	}

	/**
	 * Creates a new weekly recurring timeslot for a service.
	 * @param serviceId The service id.
	 * @param request
	 */
	@Post('{serviceId}/timeslotSchedule/timeslots')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createTimeslotItem(
		@Path() serviceId: number,
		@Body() request: TimeslotItemRequest,
	): Promise<TimeslotItemResponse> {
		const data = await this.servicesService.addTimeslotItem(serviceId, request);
		this.setStatus(201);
		return mapToTimeslotItemResponse(data);
	}

	/**
	 * Updates a weekly recurring timeslot. Existing bookings are not affected.
	 * @param serviceId The service id.
	 * @param timeslotId The weekly timeslot id.
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
	): Promise<TimeslotItemResponse> {
		const data = await this.servicesService.updateTimeslotItem({ serviceId, timeslotId, request });
		return mapToTimeslotItemResponse(data);
	}

	/**
	 * Deletes a weekly recurring timeslot. Existing bookings are not affected.
	 * @param serviceId The service id.
	 * @param timeslotId The weekly timeslot id.
	 */
	@Delete('{serviceId}/timeslotSchedule/timeslots/{timeslotId}')
	@SuccessResponse(204, 'Deleted')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async deleteTimeslotItem(@Path() serviceId: number, @Path() timeslotId: number) {
		await this.servicesService.deleteTimeslotsScheduleItem(timeslotId);
	}
}
