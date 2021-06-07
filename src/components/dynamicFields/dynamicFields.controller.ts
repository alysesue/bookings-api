import { Inject, InRequestScope } from 'typescript-ioc';
import { DynamicFieldsMapper } from './dynamicFields.mapper';
import { Body, Controller, Get, Post, Put, Path, Response, Header, SuccessResponse, Route, Security, Tags } from 'tsoa';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { DynamicFieldModel, PersistDynamicFieldModel } from './dynamicFields.apicontract';
import { DynamicFieldsService } from './dynamicFields.service';
import { MOLAuth } from 'mol-lib-common';

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
		@Body() request: PersistDynamicFieldModel,
		@Header('x-api-service') serviceId: number,
	): Promise<ApiData<DynamicFieldModel>> {
		request.serviceId = serviceId;
		const entity = await this.dynamicFieldsService.save(request);
		return ApiDataFactory.create(this.mapper.mapDataModel(entity));
	}

	/**
	 * Updates a dynamic field for bookings under a specific service.
	 *
	 * @param fieldId The dynamic field id to be updated
	 * @param request The dynamic field details
	 * @returns The updated dynamic field
	 */
	@Put('{fieldId}')
	@SuccessResponse(200, 'Updated')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async update(
		@Path() fieldId: string,
		@Body() request: PersistDynamicFieldModel,
	): Promise<ApiData<DynamicFieldModel>> {
		request.idSigned = fieldId;
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
}
