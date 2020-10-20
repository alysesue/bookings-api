import { Controller, Get, Response, Route, Tags } from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel';
import { Inject } from 'typescript-ioc';
import { UserContext } from '../../infrastructure/auth/userContext';
import { UserProfileResponse } from './users.apicontract';
import { UserProfileMapper } from './users.mapper';
import { ApiData, ApiDataFactory } from '../../apicontract';

@Route('v1/users')
@Tags('Users')
export class UsersController extends Controller {
	@Inject
	private _userContext: UserContext;
	/**
	 * Returns information about the current user.
	 * It returns Unauthorized (401) status code if the user is not logged in.
	 * @param nric
	 */
	@Get('me')
	@MOLAuth({
		admin: {},
		agency: {},
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,agency,user]')
	public async getProfile(): Promise<ApiData<UserProfileResponse>> {
		const user = await this._userContext.getCurrentUser();
		const groups = await this._userContext.getAuthGroups();
		return ApiDataFactory.create(UserProfileMapper.mapToResponse({ user, groups }));
	}
}
