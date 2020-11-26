import { VerifyUserResponse, GoogleVerifyApiResponse } from "./usersessions.apicontract";

export class UserSessionsMapper {
	public static mapToResponse(data: GoogleVerifyApiResponse): VerifyUserResponse {
		const res = new VerifyUserResponse();
		res.success = data.success;
		return res;
	}
}
