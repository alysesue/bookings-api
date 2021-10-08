import { Inject, InRequestScope } from 'typescript-ioc';
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
import { MOLAuth } from 'mol-lib-common';
import {
	TimeslotItemRequest,
	TimeslotItemResponseV1,
	TimeslotItemResponseV2,
	TimeslotsScheduleResponseV1,
	TimeslotsScheduleResponseV2,
} from '../timeslotItems/timeslotItems.apicontract';
import {
	ScheduleFormRequest,
	ScheduleFormResponseV1,
	ScheduleFormResponseV2,
} from '../scheduleForms/scheduleForms.apicontract';
import { ApiData, ApiDataFactory, ApiPagedData, ApiPagingFactory } from '../../apicontract';
import { parseCsv } from '../../tools/csvParser';
import { ServicesService } from '../services/services.service';
import { ServiceProvider } from '../../models';
import { ServiceProvidersMapper } from './serviceProviders.mapper';
import { ServiceProvidersService } from './serviceProviders.service';
import {
	ServiceProviderListRequest,
	ServiceProviderModel,
	ServiceProviderResponseModelV1,
	ServiceProviderResponseModelV2,
	TotalServiceProviderResponse,
} from './serviceProviders.apicontract';
import { IdHasher } from '../../infrastructure/idHasher';
import { TimeslotItemsMapper } from '../timeslotItems/timeslotItems.mapper';
import { ScheduleFormsMapper } from '../scheduleForms/scheduleForms.mapper';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth';
import { BookingSGAuth } from '../../infrastructure/decorators/bookingSGAuth';

@InRequestScope
@Route('v1/service-providers')
@Tags('Service Providers')
export class ServiceProvidersController extends Controller {
	@Inject
	private servicesService: ServicesService;
	@Inject
	private serviceProvidersService: ServiceProvidersService;
	@Inject
	private serviceProvidersMapper: ServiceProvidersMapper;
	@Inject
	private timeslotItemsMapper: TimeslotItemsMapper;
	@Inject
	private scheduleFormsMapper: ScheduleFormsMapper;
	@Inject
	private apiPagingFactory: ApiPagingFactory;

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
	 * Creates multiple service providers (json format).
	 *
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
	 * Creates multiple service providers (CSV format). The csv content must contain a single header called name.
	 *
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
	 *
	 * @param @isInt serviceId (Optional) Filters by a service (id).
	 * @param includeTimeslotsSchedule (Optional) Whether to include weekly timeslots in the response.
	 * @param includeScheduleForm (Optional) Whether to include working hours and breaks in the response.
	 * @param @isInt limit (Optional) the total number of records required.
	 * @param @isInt page (Optional) the page number currently requested.
	 */
	@Get('')
	@Security('optional-service')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: { requireOtp: false } })
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous]')
	public async getServiceProviders(
		@Header('x-api-service') serviceId?: number,
		@Query() includeTimeslotsSchedule = false,
		@Query() includeScheduleForm = false,
		@Query() fromAvailableDate?: Date,
		@Query() toAvailableDate?: Date,
		@Query() filterDaysInAdvance = false,
		@Query() limit?: number,
		@Query() page?: number,
	): Promise<ApiPagedData<ServiceProviderResponseModelV1>> {
		const result = await this.serviceProvidersService.getPagedServiceProviders(
			fromAvailableDate,
			toAvailableDate,
			filterDaysInAdvance,
			includeScheduleForm,
			includeTimeslotsSchedule,
			limit,
			page,
			serviceId,
		);

		return this.apiPagingFactory.createPagedAsync(result, async (serviceProvider: ServiceProvider) => {
			return await this.serviceProvidersMapper.mapDataModelV1(serviceProvider, {
				includeTimeslotsSchedule,
				includeScheduleForm,
			});
		});
	}

	/**
	 * Retrieves the total number of service providers.
	 *
	 * @param @isInt serviceId (Optional) Filters by a service (id).
	 */
	@Get('/count')
	@Security('optional-service')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: { requireOtp: false } })
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous]')
	public async getTotalServiceProviders(
		@Header('x-api-service') serviceId?: number,
	): Promise<ApiData<TotalServiceProviderResponse>> {
		const total = await this.serviceProvidersService.getServiceProvidersCount(serviceId);
		return ApiDataFactory.create({ total });
	}

	/**
	 * Retrieves available service providers in the specified datetime range.
	 *
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
	): Promise<ApiData<ServiceProviderResponseModelV1[]>> {
		let result: ServiceProvider[] = [];
		if (serviceId) {
			result = await this.serviceProvidersService.getAvailableServiceProviders(from, to, false, serviceId);
		} else {
			const servicesList = await this.servicesService.getServices();
			for (const service of servicesList) {
				result.push(
					...(await this.serviceProvidersService.getAvailableServiceProviders(from, to, false, service.id)),
				);
			}
		}
		return ApiDataFactory.create(await this.serviceProvidersMapper.mapDataModelsV1(result, {}));
	}

	/**
	 * Retrieves a single service provider.
	 *
	 * @param @isInt spId The service provider id.
	 * @param includeTimeslotsSchedule (Optional) Whether to include weekly timeslots in the response.
	 * @param includeScheduleForm (Optional) Whether to include working hours and breaks in the response.
	 */
	@Get('{spId}')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: { requireOtp: false } })
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous]')
	public async getServiceProvider(@Path() spId: number): Promise<ApiData<ServiceProviderResponseModelV1>> {
		const options = { includeTimeslotsSchedule: true, includeScheduleForm: true };
		const dataModel = await this.serviceProvidersService.getServiceProvider(
			spId,
			options.includeScheduleForm,
			options.includeTimeslotsSchedule,
		);
		return ApiDataFactory.create(await this.serviceProvidersMapper.mapDataModelV1(dataModel, options));
	}

	/**
	 * Retrieves service providers whose name contains the searchKey, mainly for autocomplete feature.
	 *
	 * @param searchKey The search keyword.
	 */
	@Get('search/{searchKey}')
	@Security('optional-service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getServiceProvidersByName(
		@Path() searchKey: string,
		@Header('x-api-service') serviceId?: number,
	): Promise<ApiData<ServiceProviderResponseModelV1[]>> {
		const dataModels = await this.serviceProvidersService.getServiceProvidersByName(searchKey, serviceId);
		return ApiDataFactory.create(await this.serviceProvidersMapper.mapDataModelsV1(dataModels, {}));
	}

	/**
	 * Updates a single service provider.
	 *
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
	): Promise<ApiData<ServiceProviderResponseModelV1>> {
		const result = await this.serviceProvidersService.updateSp(spRequest, spId);
		return ApiDataFactory.create(await this.serviceProvidersMapper.mapDataModelV1(result, {}));
	}

	/**
	 * Sets a service's schedule form which becomes the schedule form for every service provider under that service
	 *
	 * @param @isInt spId The service provider id.
	 * @param request The schedule form request
	 */
	@Put('{spId}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async setServiceScheduleForm(
		@Path() spId: number,
		@Body() request: ScheduleFormRequest,
	): Promise<ApiData<ScheduleFormResponseV1>> {
		return ApiDataFactory.create(
			this.scheduleFormsMapper.mapToResponseV1(
				await this.serviceProvidersService.setProviderScheduleForm(spId, request),
			),
		);
	}

	/**
	 * Retrieves a service's schedule form
	 *
	 * @param @isInt spId The service provider id.
	 */
	@Get('{spId}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getServiceScheduleForm(@Path() spId: number): Promise<ApiData<ScheduleFormResponseV1>> {
		return ApiDataFactory.create(
			this.scheduleFormsMapper.mapToResponseV1(await this.serviceProvidersService.getProviderScheduleForm(spId)),
		);
	}

	/**
	 * Retrieves all weekly recurring timeslots for a service provider.
	 *
	 * @param @isInt spId The service provider id.
	 */
	@Get('{spId}/timeslotSchedule')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getTimeslotsScheduleByServiceProviderId(
		@Path() spId: number,
	): Promise<ApiData<TimeslotsScheduleResponseV1>> {
		const data = await this.serviceProvidersService.getTimeslotItems(spId);
		return ApiDataFactory.create(this.timeslotItemsMapper.mapToTimeslotsScheduleResponseV1(data));
	}

	/**
	 * Creates a new weekly recurring timeslot for a service provider.
	 *
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
	): Promise<ApiData<TimeslotItemResponseV1>> {
		const data = await this.serviceProvidersService.addTimeslotItem(spId, request);
		this.setStatus(201);
		return ApiDataFactory.create(this.timeslotItemsMapper.mapToTimeslotItemResponseV1(data));
	}

	/**
	 * Updates a weekly recurring timeslot for a service provider. Existing bookings are not affected.
	 *
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
	): Promise<ApiData<TimeslotItemResponseV1>> {
		const data = await this.serviceProvidersService.updateTimeslotItem(spId, timeslotId, request);
		return ApiDataFactory.create(this.timeslotItemsMapper.mapToTimeslotItemResponseV1(data));
	}

	/**
	 * Deletes a weekly recurring timeslot for a service provider. Existing bookings are not affected.
	 *
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

@InRequestScope
@Route('v2/service-providers')
@Tags('Service Providers')
export class ServiceProvidersControllerV2 extends Controller {
	@Inject
	private servicesService: ServicesService;
	@Inject
	private serviceProvidersService: ServiceProvidersService;
	@Inject
	private serviceProvidersMapper: ServiceProvidersMapper;
	@Inject
	private timeslotsItemsMapper: TimeslotItemsMapper;
	@Inject
	private scheduleFormsMapper: ScheduleFormsMapper;
	@Inject
	private idHasher: IdHasher;
	@Inject
	private apiPagingFactory: ApiPagingFactory;

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
	 * Creates multiple service providers (json format).
	 *
	 * @param spRequest
	 * @param serviceId The service id.
	 */
	@Post('')
	@Security('service')
	@SuccessResponse(204, 'Created')
	@Deprecated()
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async addServiceProviders(
		@Body() spRequest: ServiceProviderListRequest,
		@Header('x-api-service') serviceId: string,
	): Promise<void> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		await this.serviceProvidersService.saveServiceProviders(spRequest.serviceProviders, unsignedServiceId);
	}

	/**
	 * Creates multiple service providers (CSV format). The csv content must contain a single header called name.
	 *
	 * @param spRequest
	 * @param serviceId The service id.
	 */
	@Post('/csv')
	@Deprecated()
	@Security('service')
	@SuccessResponse(204, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async addServiceProvidersText(
		@Body() spRequest: string,
		@Header('x-api-service') serviceId: string,
	): Promise<void> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		const request = ServiceProvidersControllerV2.parseCsvModelToServiceProviders(parseCsv(spRequest));
		await this.serviceProvidersService.saveServiceProviders(request, unsignedServiceId);
	}

	/**
	 * Retrieves service providers.
	 *
	 * @param serviceId (Optional) Filters by a service (id).
	 * @param includeTimeslotsSchedule (Optional) Whether to include weekly timeslots in the response.
	 * @param includeScheduleForm (Optional) Whether to include working hours and breaks in the response.
	 * @param @isInt limit (Optional) the total number of records required.
	 * @param @isInt page (Optional) the page number currently requested.
	 */
	@Get('')
	@Security('optional-service')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: { requireOtp: false } })
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous]')
	public async getServiceProviders(
		@Header('x-api-service') serviceId?: string,
		@Query() includeTimeslotsSchedule = false,
		@Query() includeScheduleForm = false,
		@Query() fromAvailableDate?: Date,
		@Query() toAvailableDate?: Date,
		@Query() filterDaysInAdvance = false,
		@Query() includeLabels = false,
		@Query() limit?: number,
		@Query() page?: number,
	): Promise<ApiData<ServiceProviderResponseModelV2[]>> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		const result = await this.serviceProvidersService.getPagedServiceProviders(
			fromAvailableDate,
			toAvailableDate,
			filterDaysInAdvance,
			includeScheduleForm,
			includeTimeslotsSchedule,
			limit,
			page,
			unsignedServiceId,
			includeLabels,
		);
		return this.apiPagingFactory.createPagedAsync(result, async (serviceProvider: ServiceProvider) => {
			return await this.serviceProvidersMapper.mapDataModelV2(serviceProvider, {
				includeTimeslotsSchedule,
				includeScheduleForm,
				includeLabels,
			});
		});
	}

	/**
	 * Retrieves the total number of service providers.
	 *
	 * @param serviceId (Optional) Filters by a service (id).
	 */
	@Get('/count')
	@Security('optional-service')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: { requireOtp: false } })
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous]')
	public async getTotalServiceProviders(
		@Header('x-api-service') serviceId?: string,
	): Promise<ApiData<TotalServiceProviderResponse>> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		const total = await this.serviceProvidersService.getServiceProvidersCount(unsignedServiceId);
		return ApiDataFactory.create({ total });
	}

	/**
	 * Retrieves available service providers in the specified datetime range.
	 *
	 * @param from The lower bound limit for service providers' availability.
	 * @param to The upper bound limit for service providers' availability.
	 * @param serviceId The service id.
	 */
	@Get('available')
	@Security('optional-service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getAvailableServiceProviders(
		@Query() from: Date,
		@Query() to: Date,
		@Header('x-api-service') serviceId?: string,
	): Promise<ApiData<ServiceProviderResponseModelV2[]>> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		let result: ServiceProvider[] = [];
		if (serviceId) {
			result = await this.serviceProvidersService.getAvailableServiceProviders(
				from,
				to,
				false,
				unsignedServiceId,
			);
		} else {
			const servicesList = await this.servicesService.getServices();
			for (const service of servicesList) {
				result.push(
					...(await this.serviceProvidersService.getAvailableServiceProviders(from, to, false, service.id)),
				);
			}
		}
		return ApiDataFactory.create(await this.serviceProvidersMapper.mapDataModelsV2(result, {}));
	}

	/**
	 * Retrieves a single service provider.
	 *
	 * @param spId The service provider id.
	 * @param includeTimeslotsSchedule (Optional) Whether to include weekly timeslots in the response.
	 * @param includeScheduleForm (Optional) Whether to include working hours and breaks in the response.
	 */
	@Get('{spId}')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: { requireOtp: false } })
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous]')
	public async getServiceProvider(@Path() spId: string): Promise<ApiData<ServiceProviderResponseModelV2>> {
		const unsignedSpId = this.idHasher.decode(spId);
		const options = { includeTimeslotsSchedule: true, includeScheduleForm: true, includeLabels: true };
		const dataModel = await this.serviceProvidersService.getServiceProvider(
			unsignedSpId,
			options.includeScheduleForm,
			options.includeTimeslotsSchedule,
			options.includeLabels,
		);
		return ApiDataFactory.create(await this.serviceProvidersMapper.mapDataModelV2(dataModel, options));
	}

	/**
	 * Retrieves service providers whose name contains the searchKey, mainly for autocomplete feature.
	 *
	 * @param searchKey The search keyword.
	 * @param serviceId The service id.
	 */
	@Get('search/{searchKey}')
	@Security('optional-service')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getServiceProvidersByName(
		@Path() searchKey: string,
		@Header('x-api-service') serviceId?: string,
	): Promise<ApiData<ServiceProviderResponseModelV2[]>> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		const dataModels = await this.serviceProvidersService.getServiceProvidersByName(searchKey, unsignedServiceId);
		return ApiDataFactory.create(await this.serviceProvidersMapper.mapDataModelsV2(dataModels, {}));
	}

	/**
	 * Updates a single service provider.
	 *
	 * @param spId The service provider id.
	 * @param spRequest
	 */
	@Put('{spId}')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async updateServiceProvider(
		@Path() spId: string,
		@Body() spRequest: ServiceProviderModel,
	): Promise<ApiData<ServiceProviderResponseModelV2>> {
		const unsignedSpId = this.idHasher.decode(spId);
		const options = { includeLabels: true };
		const result = await this.serviceProvidersService.updateSp(spRequest, unsignedSpId);
		return ApiDataFactory.create(await this.serviceProvidersMapper.mapDataModelV2(result, options));
	}

	/**
	 * Sets a service's schedule form which becomes the schedule form for every service provider under that service
	 *
	 * @param spId The service provider id.
	 * @param request The schedule form request
	 */
	@Put('{spId}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async setServiceScheduleForm(
		@Path() spId: string,
		@Body() request: ScheduleFormRequest,
	): Promise<ApiData<ScheduleFormResponseV2>> {
		const unsignedSpId = this.idHasher.decode(spId);
		return ApiDataFactory.create(
			this.scheduleFormsMapper.mapToResponseV2(
				await this.serviceProvidersService.setProviderScheduleForm(unsignedSpId, request),
			),
		);
	}

	/**
	 * Retrieves a service's schedule form
	 *
	 * @param spId The service provider id.
	 */
	@Get('{spId}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getServiceScheduleForm(@Path() spId: string): Promise<ApiData<ScheduleFormResponseV2>> {
		const unsignedSpId = this.idHasher.decode(spId);
		return ApiDataFactory.create(
			this.scheduleFormsMapper.mapToResponseV2(
				await this.serviceProvidersService.getProviderScheduleForm(unsignedSpId),
			),
		);
	}

	/**
	 * Retrieves all weekly recurring timeslots for a service provider.
	 *
	 * @param spId The service provider id.
	 */
	@Get('{spId}/timeslotSchedule')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getTimeslotsScheduleByServiceProviderId(
		@Path() spId: string,
	): Promise<ApiData<TimeslotsScheduleResponseV2>> {
		const unsignedSpId = this.idHasher.decode(spId);
		const data = await this.serviceProvidersService.getTimeslotItems(unsignedSpId);
		return ApiDataFactory.create(this.timeslotsItemsMapper.mapToTimeslotsScheduleResponseV2(data));
	}

	/**
	 * Creates a new weekly recurring timeslot for a service provider.
	 *
	 * @param spId The service provider id.
	 * @param request
	 */
	@Post('{spId}/timeslotSchedule/timeslots')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createTimeslotItem(
		@Path() spId: string,
		@Body() request: TimeslotItemRequest,
	): Promise<ApiData<TimeslotItemResponseV2>> {
		const unsignedSpId = this.idHasher.decode(spId);
		const data = await this.serviceProvidersService.addTimeslotItem(unsignedSpId, request);
		this.setStatus(201);
		return ApiDataFactory.create(this.timeslotsItemsMapper.mapToTimeslotItemResponseV2(data));
	}

	/**
	 * Updates a weekly recurring timeslot for a service provider. Existing bookings are not affected.
	 *
	 * @param spId The service provider id.
	 * @param timeslotId The weekly timeslot id.
	 * @param request
	 */
	@Put('{spId}/timeslotSchedule/timeslots/{timeslotId}')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async updateTimeslotItem(
		@Path() spId: string,
		@Path() timeslotId: string,
		@Body() request: TimeslotItemRequest,
	): Promise<ApiData<TimeslotItemResponseV2>> {
		const unsignedSpId = this.idHasher.decode(spId);
		const unsignedTimeslotId = this.idHasher.decode(timeslotId);
		const data = await this.serviceProvidersService.updateTimeslotItem(unsignedSpId, unsignedTimeslotId, request);
		return ApiDataFactory.create(this.timeslotsItemsMapper.mapToTimeslotItemResponseV2(data));
	}

	/**
	 * Deletes a weekly recurring timeslot for a service provider. Existing bookings are not affected.
	 *
	 * @param spId The service provider id.
	 * @param timeslotId The weekly timeslot id.
	 */
	@Delete('{spId}/timeslotSchedule/timeslots/{timeslotId}')
	@SuccessResponse(204, 'No Content')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async deleteTimeslotItem(@Path() spId: string, @Path() timeslotId: string): Promise<void> {
		const unsignedSpId = this.idHasher.decode(spId);
		const unsignedTimeslotId = this.idHasher.decode(timeslotId);
		await this.serviceProvidersService.deleteTimeslotItem(unsignedSpId, unsignedTimeslotId);
	}
}
