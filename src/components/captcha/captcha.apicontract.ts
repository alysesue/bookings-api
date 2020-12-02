export class VerifyUserResponse {
	public success: boolean;
}

export class GoogleVerifyApiResponse {
	public success: boolean;
	public score: number;
	public ['error-codes']: string;
}
