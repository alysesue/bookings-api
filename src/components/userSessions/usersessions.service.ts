import { InRequestScope } from "typescript-ioc";
import { post } from "../../interface";
import { VerifyUserRequest, GoogleVerifyApiResponse } from "./usersessions.apicontract";
import { ConfigUtils } from "mol-lib-common";

@InRequestScope
export class UserSessionsService {
	public async verify(request: VerifyUserRequest): Promise<GoogleVerifyApiResponse> {
		const secretKey = ConfigUtils.getValueFromEnv('RECAPTCHA_SECRET_KEY')
		const res = await post(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${request.token}`);
		return res;
	}
}
