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
