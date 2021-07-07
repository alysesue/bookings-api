import { Inject } from 'typescript-ioc';
import { Body, Controller, Delete, Get, Path, Post, Put, Query, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel';
import { mapToResponse as mapSScheduleFormResponseToResponse } from '../scheduleForms/scheduleForms.mapper';
import { ScheduleFormRequest, ScheduleFormResponse } from '../scheduleForms/scheduleForms.apicontract';
import {
	TimeslotItemRequest,
	TimeslotItemResponse,
	TimeslotsScheduleResponse,
} from '../timeslotItems/timeslotItems.apicontract';
import { mapToTimeslotItemResponse, mapToTimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.mapper';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { ServicesService } from './services.service';
import { ServiceRequest, ServiceResponse } from './service.apicontract';
import { ServicesMapper } from './services.mapper';
import {
	ServiceNotificationTemplateRequest,
	ServiceNotificationTemplateResponse,
} from '../serviceNotificationTemplate/serviceNotificationTemplate.apicontract';
import { ServiceNotificationsTemplatesService } from '../serviceNotificationTemplate/serviceNotificationTemplate.service';
import { EmailNotificationTemplateType } from '../../models/notifications';
import { ServiceNotificationTemplateMapper } from '../serviceNotificationTemplate/serviceNotificationTemplate.mapper';

@Route('v1/services')
@Tags('Services')
export class ServicesController extends Controller {
	@Inject
	private servicesService: ServicesService;

	@Inject
	private serviceMapper: ServicesMapper;

	@Inject
	private serviceNotificationsTemplatesService: ServiceNotificationsTemplatesService;

	@Inject
	private notificationTemplateMapper: ServiceNotificationTemplateMapper;

	/**
	 * Creates a service for booking.
	 *
	 * @param request
	 */
	@Post()
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createService(@Body() request: ServiceRequest): Promise<ApiData<ServiceResponse>> {
		return ApiDataFactory.create(
			this.serviceMapper.mapToServiceResponse(await this.servicesService.createService(request)),
		);
	}

	/**
	 * Update a single service.
	 *
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
		return ApiDataFactory.create(this.serviceMapper.mapToServiceResponse(service));
	}
	/**
	 * Retrieves all services.
	 *
	 * @param includeTimeslotsSchedule (Optional) Whether to include weekly timeslots in the response.
	 * @param includeScheduleForm (Optional) Whether to include working hours and breaks in the response.
	 * @param includeLabels (Optional) Whether to include labels in the response.
	 * @param includeLabelCategories (Optional) Whether to include categories with labels in the response.
	 */
	@Get()
	@SuccessResponse(200, 'Ok')
	@MOLAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async getServices(
		@Query() includeTimeslotsSchedule = false,
		@Query() includeScheduleForm = false,
		@Query() includeLabels = false,
		@Query() includeLabelCategories = false,
	): Promise<ApiData<ServiceResponse[]>> {
		const services = await this.servicesService.getServices({
			includeLabels,
			includeScheduleForm,
			includeTimeslotsSchedule,
			includeLabelCategories,
		});
		return ApiDataFactory.create(services.map((service) => this.serviceMapper.mapToServiceResponse(service)));
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
	 * Retrieves a single service. (Includes Service Labels)
	 *
	 * @param @isInt serviceId The service id.
	 * @param includeTimeslotsSchedule (Optional) Whether to include weekly timeslots in the response.
	 * @param includeScheduleForm (Optional) Whether to include working hours and breaks in the response.
	 * @param includeLabels (Optional) Whether to include labels in the response.
	 * @param includeLabelCategories (Optional) Whether to include categories with labels in the response.
	 */
	@Get('{serviceId}')
	@SuccessResponse(200, 'Ok')
	@Response(401, 'Unauthorized')
	public async getService(
		serviceId: number,
		@Query() includeTimeslotsSchedule = false,
		@Query() includeScheduleForm = false,
		@Query() includeLabels = false,
		@Query() includeLabelCategories = false,
	): Promise<ApiData<ServiceResponse>> {
		const service = await this.servicesService.getService(serviceId, {
			includeTimeslotsSchedule,
			includeScheduleForm,
			includeLabelCategories,
			includeLabels,
		});
		return ApiDataFactory.create(this.serviceMapper.mapToServiceResponse(service));
	}

	/**
	 * Retrieves all weekly recurring timeslots for a service.
	 *
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
	 *
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
	 *
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
	 *
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

	/**
	 * Get a single email notification template.
	 *
	 * @param @isInt serviceId The service id.
	 * @param @isInt  emailTemplateType The enum type of email template.
	 */
	@Get('{serviceId}/email-notifications')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getEmailNotificationTemplateByServiceId(
		@Path() serviceId: number,
		@Query() emailTemplateType: EmailNotificationTemplateType,
	): Promise<ApiData<ServiceNotificationTemplateResponse>> {
		const data = await this.serviceNotificationsTemplatesService.getEmailNotificationTemplate(
			serviceId,
			emailTemplateType,
		);
		return ApiDataFactory.create(this.notificationTemplateMapper.mapToNotificationTemplateResponse(data));
	}

	/**
	 * Creates a single email notification template.
	 *
	 * @param @isInt serviceId The service id.
	 * @param request
	 */
	@Post('{serviceId}/email-notifications')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createEmailNotificationTemplate(
		@Path() serviceId: number,
		@Body() request: ServiceNotificationTemplateRequest,
	): Promise<ApiData<ServiceNotificationTemplateResponse>> {
		request = new ServiceNotificationTemplateRequest(request.emailTemplateType, request.htmlTemplate);
		const data = await this.serviceNotificationsTemplatesService.addEmailTemplate(serviceId, request);
		return ApiDataFactory.create(this.notificationTemplateMapper.mapToNotificationTemplateResponse(data));
	}

	/**
	 * Update an existing email notification template.
	 *
	 * @param @isInt serviceId The service id.
	 * @param request
	 */
	@Put('{serviceId}/email-notifications')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async updateEmailNotificationTemplate(
		@Path() serviceId: number,
		@Body() request: ServiceNotificationTemplateRequest,
	): Promise<ApiData<ServiceNotificationTemplateResponse>> {
		request = new ServiceNotificationTemplateRequest(request.emailTemplateType, request.htmlTemplate);
		const data = await this.serviceNotificationsTemplatesService.updateEmailTemplate(serviceId, request);
		return ApiDataFactory.create(this.notificationTemplateMapper.mapToNotificationTemplateResponse(data));
	}
}
