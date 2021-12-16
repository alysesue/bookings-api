export class OtpSendRequest {
	public mobileNo: string;
	public captchaToken?: string;
	public serviceId?: string;

	constructor(mobileNo: string, captchaToken?: string, serviceId?: string) {
		this.mobileNo = mobileNo;
		this.captchaToken = captchaToken;
		this.serviceId = serviceId;
	}
}

export class OtpSendRequestServiceIdNumber {
	public mobileNo: string;
	public captchaToken?: string;
	public serviceId?: number;

	constructor(mobileNo: string, captchaToken?: string, serviceId?: number) {
		this.mobileNo = mobileNo;
		this.captchaToken = captchaToken;
		this.serviceId = serviceId;
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
	public otpCode: string;
	public captchaToken?: string;

	constructor(otpRequestId: string, otpCode: string, captchaToken?: string) {
		this.otpRequestId = otpRequestId;
		this.otpCode = otpCode;
		this.captchaToken = captchaToken;
	}
}
