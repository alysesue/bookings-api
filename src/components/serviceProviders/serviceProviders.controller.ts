import { Inject, InRequestScope } from 'typescript-ioc';
import {
	ServiceProviderListRequest,
	ServiceProviderModel,
	ServiceProviderResponseModel,
	TotalServiceProviderResponse,
} from './serviceProviders.apicontract';
import { ServiceProvidersService } from './serviceProviders.service';
import {
	Body,
	Controller,
	Delete,
	Deprecated,
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
import { mapToResponse as mapScheduleToResponse } from '../scheduleForms/scheduleForms.mapper';
import { ScheduleFormRequest, ScheduleFormResponse } from '../scheduleForms/scheduleForms.apicontract';
import { ServiceProvidersMapper } from './serviceProviders.mapper';
import {
	TimeslotItemRequest,
	TimeslotItemResponse,
	TimeslotsScheduleResponse,
} from '../timeslotItems/timeslotItems.apicontract';
import { mapToTimeslotItemResponse, mapToTimeslotsScheduleResponse } from '../timeslotItems/timeslotItems.mapper';
import { MOLAuth } from 'mol-lib-common';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { parseCsv } from '../../tools/csvParser';
import { ServicesService } from '../services/services.service';
import { ServiceProvider } from '../../models';

@InRequestScope
@Route('v1/service-providers')
@Tags('Service Providers')
export class ServiceProvidersController extends Controller {
	@Inject
	private servicesService: ServicesService;
	@Inject
	private serviceProvidersService: ServiceProvidersService;

	@Inject
	private mapper: ServiceProvidersMapper;

	// TODO: write test for this one
	/**
	 * @deprecated use onboard atm
	 */
	private static parseCsvModelToServiceProviders(csvModels: any[]) {
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
	 * @deprecated
	 * Creates multiple service providers (json format).
	 * @param spRequest
	 * @param @isInt serviceId The service id.
	 */
	@Post('')
	@Security('service')
	@SuccessResponse(204, 'Created')
	@Deprecated()
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async addServiceProviders(
		@Body() spRequest: ServiceProviderListRequest,
		@Header('x-api-service') serviceId: number,
	): Promise<void> {
		await this.serviceProvidersService.saveServiceProviders(spRequest.serviceProviders, serviceId);
	}

	/**
	 * @deprecated
	 * Creates multiple service providers (CSV format). The csv content must contain a single header called name.
	 * @param spRequest
	 * @param @isInt serviceId The service id.
	 */
	@Post('/csv')
	@Deprecated()
	@Security('service')
	@SuccessResponse(204, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async addServiceProvidersText(
		@Body() spRequest: string,
		@Header('x-api-service') serviceId: number,
	): Promise<void> {
		const request = ServiceProvidersController.parseCsvModelToServiceProviders(parseCsv(spRequest));
		await this.serviceProvidersService.saveServiceProviders(request, serviceId);
	}

	/**
	 * Retrieves service providers.
	 * @param @isInt serviceId (Optional) Filters by a service (id).
	 * @param includeTimeslotsSchedule (Optional) Whether to include weekly timeslots in the response.
	 * @param includeScheduleForm (Optional) Whether to include working hours and breaks in the response.
	 * @param @isInt limit (Optional) the total number of records required.
	 * @param @isInt page (Optional) the page number currently requested.
	 */
	@Get('')
	@Security('optional-service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getServiceProviders(
		@Header('x-api-service') serviceId?: number,
		@Query() includeTimeslotsSchedule = false,
		@Query() includeScheduleForm = false,
		@Query() limit?: number,
		@Query() page?: number,
	): Promise<ApiData<ServiceProviderResponseModel[]>> {
		const dataModels = await this.serviceProvidersService.getServiceProviders(
			serviceId,
			includeScheduleForm,
			includeTimeslotsSchedule,
			limit,
			page,
		);
		return ApiDataFactory.create(
			this.mapper.mapDataModels(dataModels, { includeTimeslotsSchedule, includeScheduleForm }),
		);
	}

	/**
	 * Retrieves the total number of service providers.
	 * @param @isInt serviceId (Optional) Filters by a service (id).
	 */
	@Get('/count')
	@Security('optional-service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getTotalServiceProviders(
		@Header('x-api-service') serviceId?: number,
	): Promise<ApiData<TotalServiceProviderResponse>> {
		const total = await this.serviceProvidersService.getServiceProvidersCount(serviceId);
		return ApiDataFactory.create({ total });
	}

	/**
	 * Retrieves available service providers in the specified datetime range.
	 * @param from The lower bound limit for service providers' availability.
	 * @param to The upper bound limit for service providers' availability.
	 * @param @isInt serviceId The service id.
	 */
	@Get('available')
	@Security('optional-service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getAvailableServiceProviders(
		@Query() from: Date,
		@Query() to: Date,
		@Header('x-api-service') serviceId?: number,
	): Promise<ApiData<ServiceProviderResponseModel[]>> {
		let result: ServiceProvider[] = [];
		if (serviceId) {
			result = await this.serviceProvidersService.getAvailableServiceProviders(from, to, serviceId);
		} else {
			const servicesList = await this.servicesService.getServices();
			for (const service of servicesList) {
				result.push(...(await this.serviceProvidersService.getAvailableServiceProviders(from, to, service.id)));
			}
		}
		return ApiDataFactory.create(this.mapper.mapDataModels(result, {}));
	}

	/**
	 * Retrieves a single service provider.
	 * @param @isInt spId The service provider id.
	 * @param includeTimeslotsSchedule (Optional) Whether to include weekly timeslots in the response.
	 * @param includeScheduleForm (Optional) Whether to include working hours and breaks in the response.
	 */
	@Get('{spId}')
	@Response(401, 'Unauthorized')
	public async getServiceProvider(@Path() spId: number): Promise<ApiData<ServiceProviderResponseModel>> {
		const options = { includeTimeslotsSchedule: true, includeScheduleForm: true };
		const dataModel = await this.serviceProvidersService.getServiceProvider(
			spId,
			options.includeScheduleForm,
			options.includeTimeslotsSchedule,
		);
		return ApiDataFactory.create(this.mapper.mapDataModel(dataModel, options));
	}

	/**
	 * Retrieves service providers whose name contains the searchKey, mainly for autocomplete feature.
	 * @param searchKey The search keyword.
	 */
	@Get('search/{searchKey}')
	@Security('optional-service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getServiceProvidersByName(
		@Path() searchKey: string,
		@Header('x-api-service') serviceId?: number,
	): Promise<ApiData<ServiceProviderResponseModel[]>> {
		const dataModels = await this.serviceProvidersService.getServiceProvidersByName(searchKey, serviceId);
		return ApiDataFactory.create(this.mapper.mapDataModels(dataModels, {}));
	}

	/**
	 * Updates a single service provider.
	 * @param @isInt spId The service provider id.
	 * @param spRequest
	 */
	@Put('{spId}')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async updateServiceProvider(
		@Path() spId: number,
		@Body() spRequest: ServiceProviderModel,
	): Promise<ApiData<ServiceProviderResponseModel>> {
		const result = await this.serviceProvidersService.updateSp(spRequest, spId);
		return ApiDataFactory.create(this.mapper.mapDataModel(result, {}));
	}

	@Put('{spId}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async setServiceScheduleForm(
		@Path() spId: number,
		@Body() request: ScheduleFormRequest,
	): Promise<ApiData<ScheduleFormResponse>> {
		return ApiDataFactory.create(
			mapScheduleToResponse(await this.serviceProvidersService.setProviderScheduleForm(spId, request)),
		);
	}

	@Get('{spId}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getServiceScheduleForm(@Path() spId: number): Promise<ApiData<ScheduleFormResponse>> {
		return ApiDataFactory.create(
			mapScheduleToResponse(await this.serviceProvidersService.getProviderScheduleForm(spId)),
		);
	}

	/**
	 * Retrieves all weekly recurring timeslots for a service provider.
	 * @param @isInt spId The service provider id.
	 */
	@Get('{spId}/timeslotSchedule')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getTimeslotsScheduleByServiceProviderId(
		@Path() spId: number,
	): Promise<ApiData<TimeslotsScheduleResponse>> {
		const data = await this.serviceProvidersService.getTimeslotItems(spId);
		return ApiDataFactory.create(mapToTimeslotsScheduleResponse(data));
	}

	/**
	 * Creates a new weekly recurring timeslot for a service provider.
	 * @param @isInt spId The service provider id.
	 * @param request
	 */
	@Post('{spId}/timeslotSchedule/timeslots')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createTimeslotItem(
		@Path() spId: number,
		@Body() request: TimeslotItemRequest,
	): Promise<ApiData<TimeslotItemResponse>> {
		const data = await this.serviceProvidersService.addTimeslotItem(spId, request);
		this.setStatus(201);
		return ApiDataFactory.create(mapToTimeslotItemResponse(data));
	}

	/**
	 * Updates a weekly recurring timeslot for a service provider. Existing bookings are not affected.
	 * @param @isInt spId The service provider id.
	 * @param @isInt timeslotId The weekly timeslot id.
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
	): Promise<ApiData<TimeslotItemResponse>> {
		const data = await this.serviceProvidersService.updateTimeslotItem(spId, timeslotId, request);
		return ApiDataFactory.create(mapToTimeslotItemResponse(data));
	}

	/**
	 * Deletes a weekly recurring timeslot for a service provider. Existing bookings are not affected.
	 * @param @isInt spId The service provider id.
	 * @param @isInt timeslotId The weekly timeslot id.
	 */
	@Delete('{spId}/timeslotSchedule/timeslots/{timeslotId}')
	@SuccessResponse(204, 'No Content')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async deleteTimeslotItem(@Path() spId: number, @Path() timeslotId: number): Promise<void> {
		await this.serviceProvidersService.deleteTimeslotItem(spId, timeslotId);
	}
}
