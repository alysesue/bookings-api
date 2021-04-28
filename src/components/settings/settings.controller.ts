import { Inject } from 'typescript-ioc';
import { Controller, Get, Query, Route, SuccessResponse, Tags } from 'tsoa';
import { ApiData, ApiDataFactory } from '../../apicontract';
import { SettingsService } from './settings.service';

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
	@SuccessResponse(200, 'Ok')
	public async verifyUrl(@Query() url): Promise<ApiData<boolean>> {
		const res = await this.settingsService.verifyUrlRedirection(url);
		return ApiDataFactory.create(res);
	}
}
