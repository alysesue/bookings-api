export class VerifyUserResponse {
	public success: boolean;
}

class GoogleVerifyApiEvent {
	public token: string;
	public siteKey: string;

	constructor(token: string, siteKey: string) {
		this.token = token;
		this.siteKey = siteKey;
	}
}
export class GoogleVerifyApiRequest {
	public event: GoogleVerifyApiEvent;

	constructor(token: string, siteKey: string) {
		this.event = new GoogleVerifyApiEvent(token, siteKey);
	}
}
export class GoogleVerifyApiRequestHeader {
	public referer: string;

	constructor(referer: string) {
		this.referer = referer;
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
