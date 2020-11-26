
export class VerifyUserRequest {
	public token: string;
	public uinfin: string;

	constructor(
		token: string, uinfin: string) {
		this.token = token;
		this.uinfin = uinfin;
	}
}
export class VerifyUserResponse {
	public success: boolean;
}

export class GoogleVerifyApiResponse {
	public success: boolean;
	public ["error-codes"]: string;
}
