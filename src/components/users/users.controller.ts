import { Controller, Get, Header, Route, Tags, } from "tsoa";
import { MOLAuth } from "mol-lib-common";
import { MOLUserAuthLevel } from "mol-lib-api-contract/auth/auth-forwarder/common/MOLUserAuthLevel";
import { MOLSecurityHeaderKeys } from "mol-lib-api-contract/auth/common/mol-security-headers";

@Route("v1/users")
@Tags('Users')
export class UsersController extends Controller {

	/**
	 * Returns information about the Singpass user.
	 * It returns Unauthorized (401) status code if the user is not logged in.
	 * @param nric
	 */
	@Get("me")
	@MOLAuth({
		admin: {},
		user: { minLevel: MOLUserAuthLevel.L2 }
	})
	public async getProfile(): Promise<any> {
		return {
			uinfin: this.getHeader(MOLSecurityHeaderKeys.USER_UINFIN)
		};
	}
}
