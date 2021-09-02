import { Inject, InRequestScope } from 'typescript-ioc';
import { Body, Controller, Path, Put, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { ScheduleFormRequest } from '../scheduleForms/scheduleForms.apicontract';
import { ServiceProvidersService } from '../serviceProviders/serviceProviders.service';
import { IdHasher } from '../../infrastructure/idHasher';

@InRequestScope
@Route('v1/organisations')
@Tags('Organisations')
export class OrganisationsController extends Controller {
	@Inject
	private serviceProvidersService: ServiceProvidersService;

	/**
	 * Creates weekly schedlue for each service providers of the organisation.
	 *
	 * @param orgaId id organisation
	 * @param request schedule form
	 */
	@Put('{orgaId}/scheduleForm')
	@SuccessResponse(204, 'no content')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async setServiceScheduleForm(@Path() orgaId: number, @Body() request: ScheduleFormRequest): Promise<void> {
		await this.serviceProvidersService.setProvidersScheduleForm(orgaId, request);
	}
}

@InRequestScope
@Route('v2/organisations')
@Tags('Organisations')
export class OrganisationsControllerV2 extends Controller {
	@Inject
	private serviceProvidersService: ServiceProvidersService;
	@Inject
	private idHasher: IdHasher;

	/**
	 * Creates weekly schedlue for each service providers of the organisation.
	 *
	 * @param orgId id organisation
	 * @param request schedule form
	 */
	@Put('{orgId}/scheduleForm')
	@SuccessResponse(204, 'no content')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async setServiceScheduleForm(@Path() orgId: string, @Body() request: ScheduleFormRequest): Promise<void> {
		const unsignedOrgId = this.idHasher.decode(orgId);
		await this.serviceProvidersService.setProvidersScheduleForm(unsignedOrgId, request);
	}
}
