import { Inject } from 'typescript-ioc';
import { Body, Controller, Delete, Get, Path, Post, Put, Query, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel';
import {
	ScheduleFormRequest,
	ScheduleFormResponseV1,
	ScheduleFormResponseV2,
} from '../scheduleForms/scheduleForms.apicontract';
import {
	TimeslotItemRequest,
	TimeslotItemResponseV1,
	TimeslotItemResponseV2,
	TimeslotsScheduleResponseV1,
	TimeslotsScheduleResponseV2,
} from '../timeslotItems/timeslotItems.apicontract';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { ServicesService } from './services.service';
import { ServiceRequestV1, ServiceRequestV2, ServiceResponseV1, ServiceResponseV2 } from './service.apicontract';
import { ServicesMapper } from './services.mapper';
import { IdHasher } from '../../infrastructure/idHasher';
import { TimeslotItemsMapper } from '../timeslotItems/timeslotItems.mapper';
import { ScheduleFormsMapper } from '../scheduleForms/scheduleForms.mapper';
import { BookingSGAuth } from '../../infrastructure/decorators/bookingSGAuth';

@Route('v1/services')
@Tags('Services')
export class ServicesController extends Controller {
	@Inject
	private servicesService: ServicesService;

	@Inject
	private serviceMapper: ServicesMapper;

	@Inject
	private timeslotItemsMapper: TimeslotItemsMapper;

	@Inject
	private scheduleFormsMapper: ScheduleFormsMapper;

	/**
	 * Creates a service for booking.
	 *
	 * @param request
	 */
	@Post()
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createService(@Body() request: ServiceRequestV1): Promise<ApiData<ServiceResponseV1>> {
		return ApiDataFactory.create(
			this.serviceMapper.mapToServiceResponseV1(await this.servicesService.createService(request)),
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
		@Body() serviceRequest: ServiceRequestV1,
	): Promise<ApiData<ServiceResponseV1>> {
		const service = await this.servicesService.updateService(serviceId, serviceRequest);
		return ApiDataFactory.create(this.serviceMapper.mapToServiceResponseV1(service));
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
	@BookingSGAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
		otp: true,
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async getServices(
		@Query() includeTimeslotsSchedule = false,
		@Query() includeScheduleForm = false,
		@Query() includeLabels = false,
		@Query() includeLabelCategories = false,
	): Promise<ApiData<ServiceResponseV1[]>> {
		const services = await this.servicesService.getServices({
			includeLabels,
			includeScheduleForm,
			includeTimeslotsSchedule,
			includeLabelCategories,
		});
		return ApiDataFactory.create(services.map((service) => this.serviceMapper.mapToServiceResponseV1(service)));
	}

	@Put('{id}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async setServiceScheduleForm(
		@Path() id: number,
		@Body() request: ScheduleFormRequest,
	): Promise<ApiData<ScheduleFormResponseV1>> {
		return ApiDataFactory.create(
			this.scheduleFormsMapper.mapToResponseV1(await this.servicesService.setServiceScheduleForm(id, request)),
		);
	}

	@Get('{id}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getServiceScheduleForm(@Path() id: number): Promise<ApiData<ScheduleFormResponseV1>> {
		return ApiDataFactory.create(
			this.scheduleFormsMapper.mapToResponseV1(await this.servicesService.getServiceScheduleForm(id)),
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
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: true })
	@SuccessResponse(200, 'Ok')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous]')
	public async getService(
		serviceId: number,
		@Query() includeTimeslotsSchedule = false,
		@Query() includeScheduleForm = false,
		@Query() includeLabels = false,
		@Query() includeLabelCategories = false,
	): Promise<ApiData<ServiceResponseV1>> {
		const service = await this.servicesService.getService(serviceId, {
			includeTimeslotsSchedule,
			includeScheduleForm,
			includeLabelCategories,
			includeLabels,
		});
		return ApiDataFactory.create(this.serviceMapper.mapToServiceResponseV1(service));
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
	public async getTimeslotsScheduleByServiceId(serviceId: number): Promise<ApiData<TimeslotsScheduleResponseV1>> {
		const data = await this.servicesService.getServiceTimeslotsSchedule(serviceId);
		return ApiDataFactory.create(this.timeslotItemsMapper.mapToTimeslotsScheduleResponseV1(data));
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
	): Promise<ApiData<TimeslotItemResponseV1>> {
		const data = await this.servicesService.addTimeslotItem(serviceId, request);
		this.setStatus(201);
		return ApiDataFactory.create(this.timeslotItemsMapper.mapToTimeslotItemResponseV1(data));
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
	): Promise<ApiData<TimeslotItemResponseV1>> {
		const data = await this.servicesService.updateTimeslotItem({ serviceId, timeslotId, request });
		return ApiDataFactory.create(this.timeslotItemsMapper.mapToTimeslotItemResponseV1(data));
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
}

@Route('v2/services')
@Tags('Services')
export class ServicesControllerV2 extends Controller {
	@Inject
	private servicesService: ServicesService;

	@Inject
	private serviceMapper: ServicesMapper;

	@Inject
	private timeslotItemsMapper: TimeslotItemsMapper;

	@Inject
	private idHasher: IdHasher;

	@Inject
	private scheduleFormsMapper: ScheduleFormsMapper;

	/**
	 * Creates a service for booking.
	 *
	 * @param request
	 */
	@Post()
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createService(@Body() request: ServiceRequestV2): Promise<ApiData<ServiceResponseV2>> {
		const unsignedOrganisationId = this.idHasher.decode(request.organisationId);
		const serviceRequest: ServiceRequestV1 = { ...request, organisationId: unsignedOrganisationId };
		return ApiDataFactory.create(
			this.serviceMapper.mapToServiceResponseV2(await this.servicesService.createService(serviceRequest)),
		);
	}

	/**
	 * Update a single service.
	 *
	 * @param serviceId The service id.
	 * @param serviceRequest
	 */
	@Put('{serviceId}')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async updateService(
		serviceId: string,
		@Body() serviceRequest: ServiceRequestV2,
	): Promise<ApiData<ServiceResponseV2>> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		const unsignedOrganisationId = this.idHasher.decode(serviceRequest.organisationId);
		const request: ServiceRequestV1 = { ...serviceRequest, organisationId: unsignedOrganisationId };
		const service = await this.servicesService.updateService(unsignedServiceId, request);
		return ApiDataFactory.create(this.serviceMapper.mapToServiceResponseV2(service));
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
	@BookingSGAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
		otp: true,
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async getServices(
		@Query() includeTimeslotsSchedule = false,
		@Query() includeScheduleForm = false,
		@Query() includeLabels = false,
		@Query() includeLabelCategories = false,
	): Promise<ApiData<ServiceResponseV2[]>> {
		const services = await this.servicesService.getServices({
			includeLabels,
			includeScheduleForm,
			includeTimeslotsSchedule,
			includeLabelCategories,
		});
		return ApiDataFactory.create(services.map((service) => this.serviceMapper.mapToServiceResponseV2(service)));
	}

	@Put('{id}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async setServiceScheduleForm(
		@Path() id: string,
		@Body() request: ScheduleFormRequest,
	): Promise<ApiData<ScheduleFormResponseV2>> {
		const unsignedServiceId = this.idHasher.decode(id);
		return ApiDataFactory.create(
			this.scheduleFormsMapper.mapToResponseV2(
				await this.servicesService.setServiceScheduleForm(unsignedServiceId, request),
			),
		);
	}

	@Get('{id}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getServiceScheduleForm(@Path() id: string): Promise<ApiData<ScheduleFormResponseV2>> {
		const unsignedServiceId = this.idHasher.decode(id);
		return ApiDataFactory.create(
			this.scheduleFormsMapper.mapToResponseV2(
				await this.servicesService.getServiceScheduleForm(unsignedServiceId),
			),
		);
	}

	/**
	 * Retrieves a single service. (Includes Service Labels)
	 *
	 * @param serviceId The service id.
	 * @param includeTimeslotsSchedule (Optional) Whether to include weekly timeslots in the response.
	 * @param includeScheduleForm (Optional) Whether to include working hours and breaks in the response.
	 * @param includeLabels (Optional) Whether to include labels in the response.
	 * @param includeLabelCategories (Optional) Whether to include categories with labels in the response.
	 */
	@Get('{serviceId}')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: true })
	@SuccessResponse(200, 'Ok')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous]')
	public async getService(
		serviceId: string,
		@Query() includeTimeslotsSchedule = false,
		@Query() includeScheduleForm = false,
		@Query() includeLabels = false,
		@Query() includeLabelCategories = false,
		@Query() includeOrganisationId = false,
	): Promise<ApiData<ServiceResponseV2>> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		const service = await this.servicesService.getService(unsignedServiceId, {
			includeTimeslotsSchedule,
			includeScheduleForm,
			includeLabelCategories,
			includeLabels,
		});
		return ApiDataFactory.create(this.serviceMapper.mapToServiceResponseV2(service, includeOrganisationId));
	}

	/**
	 * Retrieves all weekly recurring timeslots for a service.
	 *
	 * @param serviceId The service id.
	 */
	@Get('{serviceId}/timeslotSchedule')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getTimeslotsScheduleByServiceId(serviceId: string): Promise<ApiData<TimeslotsScheduleResponseV2>> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		const data = await this.servicesService.getServiceTimeslotsSchedule(unsignedServiceId);
		return ApiDataFactory.create(this.timeslotItemsMapper.mapToTimeslotsScheduleResponseV2(data));
	}

	/**
	 * Creates a new weekly recurring timeslot for a service.
	 *
	 * @param serviceId The service id.
	 * @param request
	 */
	@Post('{serviceId}/timeslotSchedule/timeslots')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createTimeslotItem(
		@Path() serviceId: string,
		@Body() request: TimeslotItemRequest,
	): Promise<ApiData<TimeslotItemResponseV2>> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		const data = await this.servicesService.addTimeslotItem(unsignedServiceId, request);
		this.setStatus(201);
		return ApiDataFactory.create(this.timeslotItemsMapper.mapToTimeslotItemResponseV2(data));
	}

	/**
	 * Updates a weekly recurring timeslot. Existing bookings are not affected.
	 *
	 * @param serviceId The service id.
	 * @param timeslotId The weekly timeslot id.
	 * @param request
	 */
	@Put('{serviceId}/timeslotSchedule/timeslots/{timeslotId}')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async updateTimeslotItem(
		@Path() serviceId: string,
		@Path() timeslotId: string,
		@Body() request: TimeslotItemRequest,
	): Promise<ApiData<TimeslotItemResponseV2>> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		const unsignedTimeslotId = this.idHasher.decode(timeslotId);
		const data = await this.servicesService.updateTimeslotItem({
			serviceId: unsignedServiceId,
			timeslotId: unsignedTimeslotId,
			request,
		});
		return ApiDataFactory.create(this.timeslotItemsMapper.mapToTimeslotItemResponseV2(data));
	}

	/**
	 * Deletes a weekly recurring timeslot. Existing bookings are not affected.
	 *
	 * @param serviceId The service id.
	 * @param timeslotId The weekly timeslot id.
	 */
	@Delete('{serviceId}/timeslotSchedule/timeslots/{timeslotId}')
	@SuccessResponse(204, 'Deleted')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async deleteTimeslotItem(@Path() serviceId: string, @Path() timeslotId: string): Promise<void> {
		const unsignedTimeslotId = this.idHasher.decode(timeslotId);
		await this.servicesService.deleteTimeslotsScheduleItem(unsignedTimeslotId);
	}
}
