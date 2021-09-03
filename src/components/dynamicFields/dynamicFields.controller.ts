import { Inject, InRequestScope } from 'typescript-ioc';
import { DynamicFieldsMapper } from './dynamicFields.mapper';
import {
	Body,
	Controller,
	Delete,
	Get,
	Post,
	Put,
	Path,
	Response,
	Header,
	SuccessResponse,
	Route,
	Security,
	Tags,
} from 'tsoa';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { DynamicFieldModel, PersistDynamicFieldModelV1, PersistDynamicFieldModelV2 } from './dynamicFields.apicontract';
import { DynamicFieldsService } from './dynamicFields.service';
import { MOLAuth } from 'mol-lib-common';
import { IdHasher } from '../../infrastructure/idHasher';

@InRequestScope
@Route('v1/dynamicFields')
@Tags('Dynamic Fields')
export class DynamicFieldsController extends Controller {
	@Inject
	private dynamicFieldsService: DynamicFieldsService;
	@Inject
	private mapper: DynamicFieldsMapper;

	/**
	 * Creates a dynamic field for bookings under a specific service.
	 *
	 * @param request The dynamic field details
	 * @param serviceId The service to add this dynamic field to
	 * @returns A new dynamic field
	 */
	@Post()
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Security('service')
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async create(
		@Body() request: PersistDynamicFieldModelV1,
		@Header('x-api-service') serviceId: number,
	): Promise<ApiData<DynamicFieldModel>> {
		request.serviceId = serviceId;
		const entity = await this.dynamicFieldsService.save(request);
		this.setStatus(201);
		return ApiDataFactory.create(this.mapper.mapDataModel(entity));
	}

	/**
	 * Updates a dynamic field for bookings under a specific service.
	 *
	 * @param id The dynamic field id to be updated
	 * @param request The dynamic field details
	 * @returns The updated dynamic field
	 */
	@Put('{id}')
	@SuccessResponse(200, 'Updated')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async update(
		@Path() id: string,
		@Body() request: PersistDynamicFieldModelV1,
	): Promise<ApiData<DynamicFieldModel>> {
		request.idSigned = id;
		const entity = await this.dynamicFieldsService.update(request);
		return ApiDataFactory.create(this.mapper.mapDataModel(entity));
	}

	/**
	 * Retrieves dynamic fields
	 *
	 * @param @isInt serviceId The service id.
	 */
	@Get('')
	@Security('service')
	public async getDynamicFields(@Header('x-api-service') serviceId: number): Promise<ApiData<DynamicFieldModel[]>> {
		const entries = await this.dynamicFieldsService.getServiceFields(serviceId);
		return ApiDataFactory.create(this.mapper.mapDataModels(entries));
	}

	/**
	 * Deletes a dynamic field
	 *
	 * @param id The dynamic field id to be deleted
	 */
	@Delete('{id}')
	@SuccessResponse(204, 'Deleted')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async delete(@Path() id: string): Promise<void> {
		await this.dynamicFieldsService.delete(id);
	}
}

@InRequestScope
@Route('v2/dynamicFields')
@Tags('Dynamic Fields')
export class DynamicFieldsControllerV2 extends Controller {
	@Inject
	private dynamicFieldsService: DynamicFieldsService;
	@Inject
	private mapper: DynamicFieldsMapper;
	@Inject
	private idHasher: IdHasher;

	/**
	 * Creates a dynamic field for bookings under a specific service.
	 *
	 * @param request The dynamic field details
	 * @param serviceId The service to add this dynamic field to
	 * @returns A new dynamic field
	 */
	@Post()
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Security('service')
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async create(
		@Body() request: PersistDynamicFieldModelV2,
		@Header('x-api-service') serviceId: string,
	): Promise<ApiData<DynamicFieldModel>> {
		request.serviceId = serviceId;
		const unsignedServiceId = this.idHasher.decode(request.serviceId);
		const requestParams: PersistDynamicFieldModelV1 = { ...request, serviceId: unsignedServiceId };
		const entity = await this.dynamicFieldsService.save(requestParams);
		this.setStatus(201);
		return ApiDataFactory.create(this.mapper.mapDataModel(entity));
	}

	/**
	 * Updates a dynamic field for bookings under a specific service.
	 *
	 * @param id The dynamic field id to be updated
	 * @param request The dynamic field details
	 * @returns The updated dynamic field
	 */
	@Put('{id}')
	@SuccessResponse(200, 'Updated')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async update(
		@Path() id: string,
		@Body() request: PersistDynamicFieldModelV2,
	): Promise<ApiData<DynamicFieldModel>> {
		request.idSigned = id;
		const unsignedServiceId = this.idHasher.decode(request.serviceId);
		const requestParams: PersistDynamicFieldModelV1 = { ...request, serviceId: unsignedServiceId };
		const entity = await this.dynamicFieldsService.update(requestParams);
		return ApiDataFactory.create(this.mapper.mapDataModel(entity));
	}

	/**
	 * Retrieves dynamic fields
	 *
	 * @param serviceId The service id.
	 */
	@Get('')
	@Security('service')
	public async getDynamicFields(@Header('x-api-service') serviceId: string): Promise<ApiData<DynamicFieldModel[]>> {
		const unsignedServiceId = this.idHasher.decode(serviceId);
		const entries = await this.dynamicFieldsService.getServiceFields(unsignedServiceId);
		return ApiDataFactory.create(this.mapper.mapDataModels(entries));
	}
}
