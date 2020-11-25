import {
	Body,
	Controller,
	Path,
	Post,
	Response,
	Route,
	SuccessResponse,
	Tags,
} from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth';
import { VerifyUserRequest, VerifyUserResponse } from './usersessions.apicontract';
import { Inject } from 'typescript-ioc';
import { UserSessionsService } from './usersessions.service';
import { ApiData, ApiDataFactory } from '../../apicontract';


@Route('v1/usersessions')
@Tags('UserSessions')
export class UserSessionsController extends Controller {
	@Inject
	private userSessionsService: UserSessionsService;

	@Post('anonymous')
	public async verifyCaptcha(@Body() verifyRequest: VerifyUserRequest): Promise<ApiData<VerifyUserResponse>> {
		return ApiDataFactory.create(new VerifyUserResponse(await this.userSessionsService.verify(verifyRequest)));
	}
}
