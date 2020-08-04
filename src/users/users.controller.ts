import { Controller, Get, Header, Route, Tags, } from "tsoa";
import { AuthLevel } from "mol-lib-common";
import { Auth } from "mol-lib-api-contract";

@Route("v1/users")
@Tags('Users')
export class UsersController extends Controller {

	/**
	 * Returns information about the Singpass user.
	 * It returns Unauthorized (401) status code if the user is not logged in.
	 * @param nric
	 */
	@Get("me")
	@AuthLevel(Auth.MOLAuthorizationLevel.L2)
	public async getProfile(
		@Header("nric") nric?: string,
	): Promise<any> {
		return { nric };
	}
}
