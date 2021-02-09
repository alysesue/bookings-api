import { Body, Controller, Get, Header, Post, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { Inject } from 'typescript-ioc';
import { UserContext } from '../../infrastructure/auth/userContext';
import { UserProfileResponse } from './users.apicontract';
import { UserProfileMapper } from './users.mapper';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { parseCsv, stringToArrayOfStringWhenSemicolon } from '../../tools/csvParser';
import { MolServiceProviderOnboardContract } from '../serviceProviders/serviceProviders.apicontract';
import { ServiceProvidersService } from '../serviceProviders/serviceProviders.service';
import { ServicesService } from '../services/services.service';
import {
	MolServiceAdminUserContract,
	MolServiceAdminUserCSV,
	MolUpsertUsersResult,
} from './molUsers/molUsers.apicontract';

@Route('v1/users')
@Tags('Users')
export class UsersController extends Controller {
	@Inject
	private _userContext: UserContext;
	@Inject
	private serviceProvidersService: ServiceProvidersService;
	@Inject
	private servicesService: ServicesService;

	/**
	 * Returns information about the current user.
	 * It returns Unauthorized (401) status code if the user is not logged in.
	 */
	@Get('me')
	@SuccessResponse(200, 'Ok')
	@Response(401, 'Unauthorized')
	public async getProfile(): Promise<ApiData<UserProfileResponse>> {
		const user = await this._userContext.getCurrentUser();
		const groups = await this._userContext.getAuthGroups();
		return ApiDataFactory.create(UserProfileMapper.mapToResponse({ user, groups }));
	}

	/**
	 * Creates multiple admin for services(CSV format). Only available for organisation user.
	 * Create new service if not exist
	 * @param serviceRequest
	 * @param @isInt serviceId The service id.
	 *  The `desired-delivery-medium` header is expected as a comma separated string and if not set will default to not sending any invitations<br/>
	 * e.g. "desired-delivery-medium": "EMAIL,SMS"
	 */
	@Post('service-admins/upsert/csv')
	@SuccessResponse(200, 'Created')
	@MOLAuth({ agency: {}, admin: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createServicesAdminsCSV(
		@Body() serviceRequest: string,
		@Header('cookie') cookie: string,
		@Header('desired-delivery-medium') desiredDeliveryMediumsHeader?: string,
	): Promise<MolUpsertUsersResult> {
		const requestList = parseCsv<MolServiceAdminUserCSV>(serviceRequest);
		const entries = requestList.map((user) => ({
			...user,
			serviceNames: stringToArrayOfStringWhenSemicolon(user.serviceNames),
		}));
		return await this.servicesService.createServicesAdmins(entries, cookie, desiredDeliveryMediumsHeader);
	}

	/**
	 * Creates multiple admin for services(JSON format). Only available for organisation user.
	 * Create new service if not exist
	 * @param serviceRequest
	 * @param @isInt serviceId The service id.
	 * The `desired-delivery-medium` header is expected as a comma separated string and if not set will default to not sending any invitations<br/>
	 * e.g. "desired-delivery-medium": "EMAIL,SMS"
	 */
	@Post('service-admins/upsert')
	@SuccessResponse(200, 'Created')
	@MOLAuth({ agency: {}, admin: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createServicesAdmins(
		@Body() data: MolServiceAdminUserContract[],
		@Header('cookie') cookie: string,
		@Header('desired-delivery-medium') desiredDeliveryMediumsHeader?: string,
	): Promise<MolUpsertUsersResult> {
		return await this.servicesService.createServicesAdmins(data, cookie, desiredDeliveryMediumsHeader);
	}

	/**
	 * Creates multiple service providers (CSV format). Only available for organisation user.
	 * @param spRequest
	 * @param @isInt serviceId The service id.
	 *  The `desired-delivery-medium` header is expected as a comma separated string and if not set will default to not sending any invitations<br/>
	 * e.g. "desired-delivery-medium": "EMAIL,SMS"
	 */
	@Post('service-providers/upsert/csv')
	@SuccessResponse(200, 'Created')
	@MOLAuth({ agency: {}, admin: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async onboardServiceProvidersCSV(
		@Body() spRequest: string,
		@Header('cookie') cookie: string,
		@Header('desired-delivery-medium') desiredDeliveryMediumsHeader?: string,
	): Promise<MolUpsertUsersResult> {
		const entries = parseCsv<MolServiceProviderOnboardContract>(spRequest);
		return await this.serviceProvidersService.createServiceProviders(entries, cookie, desiredDeliveryMediumsHeader);
	}

	/**
	 * Creates multiple service providers (JSON format). Only available for organisation user.
	 * @param spRequest
	 * @param @isInt serviceId The service id.
	 * The `desired-delivery-medium` header is expected as a comma separated string and if not set will default to not sending any invitations<br/>
	 * e.g. "desired-delivery-medium": "EMAIL,SMS"
	 */
	@Post('service-providers/upsert')
	@SuccessResponse(200, 'Created')
	@MOLAuth({ agency: {}, admin: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async onboardServiceProviders(
		@Body() serviceProviderOnboards: MolServiceProviderOnboardContract[],
		@Header('cookie') cookie: string,
		@Header('desired-delivery-medium') desiredDeliveryMediumsHeader?: string,
	): Promise<MolUpsertUsersResult> {
		return await this.serviceProvidersService.createServiceProviders(
			serviceProviderOnboards,
			cookie,
			desiredDeliveryMediumsHeader,
		);
	}
}
