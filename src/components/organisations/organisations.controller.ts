import { Inject, InRequestScope } from 'typescript-ioc';
import { Body, Controller, Get, Path, Put, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { ScheduleFormRequest } from '../scheduleForms/scheduleForms.apicontract';
import { ServiceProvidersService } from '../serviceProviders/serviceProviders.service';
import { IdHasher } from '../../infrastructure/idHasher';
import { OrganisationSettingsRequest, OrganisationSettingsResponse } from './organisations.apicontract';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { OrganisationsMapper } from './organisations.mapper';
import { OrganisationSettingsService } from './organisations.settings.service';
import {ServiceProviderLabelResponse} from "../serviceProvidersLabels/serviceProvidersLabels.apicontract";
import {MOLUserAuthLevel} from "mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel";

@InRequestScope
@Route('v1/organisations')
@Tags('Organisations')
export class OrganisationsController extends Controller {
	@Inject
	private serviceProvidersService: ServiceProvidersService;

	/**
	 * Creates weekly schedule for each service providers of the organisation.
	 *
	 * @param orgaId id organisation
	 * @param request schedule form
	 */
	@Put('{orgaId}/scheduleForm')
	@SuccessResponse(204, 'no content')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async setOrganisationScheduleForm(
		@Path() orgaId: number,
		@Body() request: ScheduleFormRequest,
	): Promise<void> {
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
	@Inject
	private organisationSettingsService: OrganisationSettingsService;
	@Inject
	private organisationsMapper: OrganisationsMapper;

	/**
	 * Creates weekly schedule for each service providers of the organisation.
	 *
	 * @param orgId id organisation
	 * @param request schedule form
	 */
	@Put('{orgId}/scheduleForm')
	@SuccessResponse(204, 'no content')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async setOrganisationScheduleForm(
		@Path() orgId: string,
		@Body() request: ScheduleFormRequest,
	): Promise<void> {
		const unsignedOrgId = this.idHasher.decode(orgId);
		await this.serviceProvidersService.setProvidersScheduleForm(unsignedOrgId, request);
	}

	/**
	 * Get organisation settings
	 *
	 * @param orgId id organisation
	 *
	 */
	@Get('{orgId}/settings')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getOrganisationSettings(@Path() orgId: string): Promise<ApiData<OrganisationSettingsResponse>> {
		const unsignedOrgId = this.idHasher.decode(orgId);
		const settings = await this.organisationSettingsService.getOrgSettings(unsignedOrgId);
		return ApiDataFactory.create(this.organisationsMapper.mapToOrganisationSettings(settings));
	}

	/**
	 * Get labels organisation settings
	 *
	 * @param orgId id organisation
	 *
	 */
	@Get('{orgId}/settings/labels')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 } })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getOrganisationLabels(@Path() orgId: string): Promise<ApiData<ServiceProviderLabelResponse>> {
		const unsignedOrgId = this.idHasher.decode(orgId);
		const res = await this.organisationSettingsService.getLabels(unsignedOrgId);
		return ApiDataFactory.create(this.organisationsMapper.mapToOrganisationLabels(res.labels, res.categories));
	}

	/**
	 * Updates organisation settings
	 *
	 * @param orgId id organisation
	 * @param request organisation settings
	 */
	@Put('{orgId}/settings')
	@SuccessResponse(200, 'Ok')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async setOrganisationSettings(
		@Path() orgId: string,
		@Body() request: OrganisationSettingsRequest,
	): Promise<ApiData<OrganisationSettingsResponse>> {
		const unsignedOrgId = this.idHasher.decode(orgId);
		const settings = await this.organisationSettingsService.updateOrgSettings(unsignedOrgId, request);
		return ApiDataFactory.create(this.organisationsMapper.mapToOrganisationSettings(settings));
	}
}
