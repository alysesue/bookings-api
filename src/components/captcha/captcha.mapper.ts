import { GoogleVerifyApiResponse, VerifyUserResponse } from './captcha.apicontract';

export class CaptchaMapper {
	public static mapToResponse(data: GoogleVerifyApiResponse): VerifyUserResponse {
		const res = new VerifyUserResponse();
		res.success = data.tokenProperties.valid;
		return res;
	}
}
