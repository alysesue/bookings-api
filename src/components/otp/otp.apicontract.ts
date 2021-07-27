export class OtpSendRequest {
	public mobileNo: string;

	public captchaToken?: string;

	public captchaOrigin?: string;

	constructor(mobileNo: string, captchaToken?: string, captchaOrigin?: string) {
		this.mobileNo = mobileNo;
		this.captchaToken = captchaToken;
		this.captchaOrigin = captchaOrigin;
	}
}

export class OtpSendResponse {
	public otpRequestId: string;

	constructor(otpReqId: string) {
		this.otpRequestId = otpReqId;
	}
}
