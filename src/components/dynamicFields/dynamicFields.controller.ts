import { Inject, InRequestScope } from 'typescript-ioc';
import { DynamicFieldsMapper } from './dynamicFields.mapper';
import { Controller, Get, Header, Route, Security, Tags } from 'tsoa';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { DynamicFieldModel } from './dynamicFields.apicontract';
import { DynamicFieldsService } from './dynamicFields.service';

@InRequestScope
@Route('v1/dynamicFields')
@Tags('Dynamic Fields')
export class DynamicFieldsController extends Controller {
	@Inject
	private dynamicFieldsService: DynamicFieldsService;
	@Inject
	private mapper: DynamicFieldsMapper;

	/**
	 * Retrieves dynamic fields
	 * @param @isInt serviceId The service id.
	 */
	@Get('')
	@Security('service')
	public async getDynamicFields(@Header('x-api-service') serviceId: number): Promise<ApiData<DynamicFieldModel[]>> {
		const entries = await this.dynamicFieldsService.getServiceFields(serviceId);
		return ApiDataFactory.create(this.mapper.mapDataModels(entries));
	}
}
