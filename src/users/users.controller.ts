import { Controller, Get, Header, Route, Tags, } from "tsoa";
import { AuthLevel } from "mol-lib-common";
import { Auth } from "mol-lib-api-contract";

@Route("v1/users")
@Tags('Users')
export class UsersController extends Controller {
	@Get("me")
	@AuthLevel(Auth.MOLAuthorizationLevel.L2)
	public async getProfile(
		@Header("nric") nric: string,
	): Promise<any> {
		return { nric };
	}
}
