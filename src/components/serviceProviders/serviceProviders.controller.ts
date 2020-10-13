import { Inject, InRequestScope } from 'typescript-ioc';
import {
	ServiceProviderListRequest,
	ServiceProviderModel,
	ServiceProviderResponseModel,
	SetProviderScheduleFormRequest,
} from './serviceProviders.apicontract';
import { ServiceProvidersService } from './serviceProviders.service';
import {
	Body,
	Controller,
	Delete,
	Get,
	Header,
	Path,
	Post,
	Put,
	Query,
	Response,
	Route,
	Security,
	SuccessResponse,
	Tags,
} from 'tsoa';
import { parseCsv } from '../../utils';
import { mapToResponse as mapScheduleToResponse } from '../scheduleForms/scheduleForms.mapper';
import { ScheduleFormResponse } from '../scheduleForms/scheduleForms.apicontract';
import { ServiceProvidersMapper } from './serviceProviders.mapper';
import {
	TimeslotItemRequest,
	TimeslotItemResponse,
	TimeslotsScheduleResponse,
} from '../timeslotItems/timeslotItems.apicontract';
import { mapToTimeslotItemResponse, mapToTimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.mapper';
import { MOLAuth } from 'mol-lib-common';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel';

@InRequestScope
@Route('v1/service-providers')
@Tags('Service Providers')
export class ServiceProvidersController extends Controller {
	@Inject
	private serviceProvidersService: ServiceProvidersService;

	@Inject
	private mapper: ServiceProvidersMapper;

	// TODO: write test for this one
	private static parseCsvModelToServiceProviders(csvModels: []) {
		try {
			const serviceProvidersRequest = csvModels as ServiceProviderModel[];

			if (serviceProvidersRequest.length !== csvModels.length) {
				throw new Error('Invalid model format');
			}
			return serviceProvidersRequest;
		} catch (e) {
			throw new Error('Invalid model format');
		}
	}

	/**
	 * Creates multiple service providers (json format).
	 * @param spRequest
	 * @param serviceId The service id.
	 */
	@Post('')
	@Security('service')
	@SuccessResponse(204, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async addServiceProviders(
		@Body() spRequest: ServiceProviderListRequest,
		@Header('x-api-service') serviceId: number,
	) {
		await this.serviceProvidersService.saveServiceProviders(spRequest.serviceProviders, serviceId);
	}

	/**
	 * Creates multiple service providers (CSV format). The csv content must contain a single header called name.
	 * @param spRequest
	 * @param serviceId The service id.
	 */
	@Post('/csv')
	@Security('service')
	@SuccessResponse(204, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async addServiceProvidersText(@Body() spRequest: string, @Header('x-api-service') serviceId: number) {
		const request = ServiceProvidersController.parseCsvModelToServiceProviders(parseCsv(spRequest));
		await this.serviceProvidersService.saveServiceProviders(request, serviceId);
	}

	/**
	 * Retrieves service providers.
	 * @param serviceId (Optional) Filters by a service (id).
	 * @param includeTimeslotsSchedule (Optional) Whether to include weekly timeslots in the response.
	 */
	@Get('')
	@Security('optional-service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getServiceProviders(
		@Header('x-api-service') serviceId?: number,
		@Query() includeTimeslotsSchedule = false,
	): Promise<ServiceProviderResponseModel[]> {
		const dataModels = await this.serviceProvidersService.getServiceProviders(
			serviceId,
			undefined,
			includeTimeslotsSchedule,
		);
		return this.mapper.mapDataModels(dataModels);
	}

	@Get('available')
	@Security('service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getAvailableServiceProviders(
		@Query() from: Date,
		@Query() to: Date,
		@Header('x-api-service') serviceId: number,
	): Promise<ServiceProviderResponseModel[]> {
		const dataModels = await this.serviceProvidersService.getAvailableServiceProviders(from, to, serviceId);
		return this.mapper.mapDataModels(dataModels);
	}

	/**
	 * Retrieves a single service provider.
	 * @param spId The service provider id.
	 */
	@Get('{spId}')
	@MOLAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async getServiceProvider(@Path() spId: number): Promise<ServiceProviderResponseModel> {
		const dataModel = await this.serviceProvidersService.getServiceProvider(spId, true, true);
		return this.mapper.mapDataModel(dataModel);
	}

	/**
	 * Updates a single service provider.
	 * @param spId The service provider id.
	 * @param spRequest
	 */
	@Put('{spId}')
	public async updateServiceProvider(
		@Path() spId: number,
		@Body() spRequest: ServiceProviderModel,
	): Promise<ServiceProviderResponseModel> {
		const result = await this.serviceProvidersService.updateSp(spRequest, spId);
		return this.mapper.mapDataModel(result);
	}

	@Put('{spId}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async setServiceScheduleForm(
		@Path() spId: number,
		@Body() request: SetProviderScheduleFormRequest,
	): Promise<ScheduleFormResponse> {
		return mapScheduleToResponse(await this.serviceProvidersService.setProviderScheduleForm(spId, request));
	}

	@Get('{spId}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getServiceScheduleForm(@Path() spId: number): Promise<ScheduleFormResponse> {
		return mapScheduleToResponse(await this.serviceProvidersService.getProviderScheduleForm(spId));
	}

	/**
	 * Retrieves all weekly recurring timeslots for a service provider.
	 * @param spId The service provider id.
	 */
	@Get('{spId}/timeslotSchedule')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getTimeslotsScheduleByServiceProviderId(@Path() spId: number): Promise<TimeslotsScheduleResponse> {
		const data = await this.serviceProvidersService.getTimeslotItems(spId);
		return mapToTimeslotsScheduleResponse(data);
	}

	/**
	 * Creates a new weekly recurring timeslot for a service provider.
	 * @param spId The service provider id.
	 * @param request
	 */
	@Post('{spId}/timeslotSchedule/timeslots')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createTimeslotItem(
		@Path() spId: number,
		@Body() request: TimeslotItemRequest,
	): Promise<TimeslotItemResponse> {
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
	@Put('{spId}/timeslotSchedule/timeslots/{timeslotId}')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async updateTimeslotItem(
		@Path() spId: number,
		@Path() timeslotId: number,
		@Body() request: TimeslotItemRequest,
	): Promise<TimeslotItemResponse> {
		const data = await this.serviceProvidersService.updateTimeslotItem(spId, timeslotId, request);
		return mapToTimeslotItemResponse(data);
	}

	/**
	 * Deletes a weekly recurring timeslot for a service provider. Existing bookings are not affected.
	 * @param spId The service provider id.
	 * @param timeslotId The weekly timeslot id.
	 */
	@Delete('{spId}/timeslotSchedule/timeslots/{timeslotId}')
	@SuccessResponse(204, 'No Content')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async deleteTimeslotItem(@Path() spId: number, @Path() timeslotId: number) {
		await this.serviceProvidersService.deleteTimeslotItem(spId, timeslotId);
	}
}
