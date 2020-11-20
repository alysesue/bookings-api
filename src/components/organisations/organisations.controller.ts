import { Inject, InRequestScope } from 'typescript-ioc';
import { Body, Controller, Path, Put, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { ScheduleFormRequest } from '../scheduleForms/scheduleForms.apicontract';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { ServiceProvidersService } from '../serviceProviders/serviceProviders.service';
import { ServiceProvidersMapper } from '../serviceProviders/serviceProviders.mapper';
import { ServiceProviderResponseModel } from '../serviceProviders/serviceProviders.apicontract';

@InRequestScope
@Route('v1/organisations')
@Tags('Organisations')
export class OrganisationsController extends Controller {
	@Inject
	private serviceProvidersService: ServiceProvidersService;
	@Inject
	private mapper: ServiceProvidersMapper;

	/**
	 * Creates weekly schedlue for each service providers of the organisation.
	 * @param orgaId id organisation
	 * @param request schedule form
	 */
	@Put('{orgaId}/scheduleForm')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async setServiceScheduleForm(
		@Path() orgaId: number,
		@Body() request: ScheduleFormRequest,
	): Promise<ApiData<ServiceProviderResponseModel[]>> {
		const data = await this.serviceProvidersService.setProvidersScheduleForm(orgaId, request);
		return ApiDataFactory.create(this.mapper.mapDataModels(data));
	}
}
