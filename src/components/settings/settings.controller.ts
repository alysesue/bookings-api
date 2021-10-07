import { Inject } from 'typescript-ioc';
import { Controller, Get, Query, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { SettingsService } from './settings.service';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth';
import { BookingSGAuth } from '../../infrastructure/decorators/bookingSGAuth';
import { ConfigUtils } from 'mol-lib-common';

@Route('v1/settings')
@Tags('Settings')
export class SettingsController extends Controller {
	@Inject
	private settingsService: SettingsService;

	/**
	 * Verify if url redirection is part of the whitelist address
	 *
	 * @param url
	 */
	@Get('isValidRedirectUrl')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 }, anonymous: { requireOtp: false } })
	@SuccessResponse(200, 'Ok')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous]')
	public async verifyUrl(@Query() url): Promise<ApiData<boolean>> {
		const res = await this.settingsService.verifyUrlRedirection(url);
		return ApiDataFactory.create(res);
	}

	@Get('/hideEvents')
	@BookingSGAuth({ admin: {}, agency: {}, user: { minLevel: MOLUserAuthLevel.L2 } })
	@SuccessResponse(200, 'Ok')
	@Response(401, 'Valid authentication types: [admin,agency,user,anonymous]')
	public async hideEvents(): Promise<ApiData<boolean>> {
		return ApiDataFactory.create(ConfigUtils.getBooleanValueFromEnv(process.env.HIDE_EVENTS));
	}
}
