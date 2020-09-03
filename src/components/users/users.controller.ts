import { Controller, Get, Response, Route, Tags } from 'tsoa';
import { MOLAuth } from 'mol-lib-common';
import { MOLUserAuthLevel } from 'mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel';
import { Inject } from 'typescript-ioc';
import { UserContext } from '../../infrastructure/userContext.middleware';
import { User } from '../../models';
import { AdminUserContract, ProfileResponse, SingPassUserContract, UserTypeContract } from './users.apicontract';

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
		user: { minLevel: MOLUserAuthLevel.L2 },
	})
	@Response(401, 'Valid authentication types: [admin,user]')
	public async getProfile(): Promise<ProfileResponse> {
		const user = await this._userContext.getCurrentUser();
		return UsersController.mapToResponse(user);
	}

	private static mapToResponse(user: User): ProfileResponse {
		const instance = new ProfileResponse();
		if (user.isCitizen()) {
			instance.userType = UserTypeContract.singpass;
			instance.singpass = new SingPassUserContract();
			instance.singpass.uinfin = user.singPassUser.UinFin;
		} else if (user.isAdmin()) {
			instance.userType = UserTypeContract.admin;
			instance.admin = new AdminUserContract();
			instance.admin.email = user.adminUser.email;
		} else {
			throw new Error('User cannot be mapped to ProfileResponse. Id: ' + user.id);
		}

		return instance;
	}
}
