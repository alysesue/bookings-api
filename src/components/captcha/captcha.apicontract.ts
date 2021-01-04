export class VerifyUserResponse {
	public success: boolean;
}

class GoogleVerifyApiEvent {
	public token: string;
	public sitekey: string;

	constructor(token: string, sitekey: string) {
		this.token = token;
		this.sitekey = sitekey;

	}

}
export class GoogleVerifyApiRequest {
	public event: GoogleVerifyApiEvent;

	constructor(token: string, sitekey: string) {
		this.event = new GoogleVerifyApiEvent(token, sitekey);
	}

}

export class TokenProperties {
	public valid: boolean;
	public hostname: string;
	public action: string;
	public createTime: string;
}

export class GoogleVerifyApiResponse {
	public tokenProperties: TokenProperties;
	public score: number;
	public reasons: string[];
	public event: GoogleVerifyApiEvent;
	public name: string;
}
