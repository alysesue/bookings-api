
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

	constructor(
		googleApiResponse: GoogleVerifyApiResponse) {
		this.success = googleApiResponse.success;
	}
}

export class GoogleVerifyApiResponse {
	public success: boolean;
	public ["error-codes"]: string;
}
