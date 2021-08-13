export class OtpSendRequest {
	public mobileNo: string;
	public captchaToken?: string;

	constructor(mobileNo: string, captchaToken?: string) {
		this.mobileNo = mobileNo;
		this.captchaToken = captchaToken;
	}
}

export class OtpSendResponse {
	public otpRequestId: string;

	constructor(otpReqId: string) {
		this.otpRequestId = otpReqId;
	}
}
export class OtpVerifyRequest {
	public otpRequestId: string;
	public otpCode: number;
	public captchaToken?: string;

	constructor(otpRequestId: string, otpCode: number, captchaToken?: string) {
		this.otpRequestId = otpRequestId;
		this.otpCode = otpCode;
		this.captchaToken = captchaToken;
	}
}
