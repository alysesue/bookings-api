import { Controller, Get, Response, Route, SuccessResponse, Tags } from 'tsoa';
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
	 */
	@Get('me')
	@SuccessResponse(200, 'Ok')
	@Response(401, 'Unauthorized')
	public async getProfile(): Promise<ApiData<UserProfileResponse>> {
		const user = await this._userContext.getCurrentUser();
		const groups = await this._userContext.getAuthGroups();
		return ApiDataFactory.create(UserProfileMapper.mapToResponse({ user, groups }));
	}
}
