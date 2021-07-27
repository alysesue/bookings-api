import { MobileOtpCookieHelper } from './../../infrastructure/bookingSGCookieHelper';
import { ApiDataFactory, ApiData } from './../../apicontract';
import { OtpSendRequest, OtpSendResponse, OtpVerifyRequest } from './otp.apicontract';
import { Controller, Post, Route, Tags, SuccessResponse, Body, Response } from 'tsoa';
import { Inject } from 'typescript-ioc';
import { OtpService } from '../otp/otp.service';

@Route('v1/otp')
@Tags('Otp')
export class OtpController extends Controller {
	@Inject
	private otpService: OtpService;
	@Inject
	private mobileOtpCookieHelper: MobileOtpCookieHelper;

	@Post('send')
	@SuccessResponse(200, 'Success')
	public async sendOtp(@Body() otpReqBody: OtpSendRequest): Promise<ApiData<OtpSendResponse>> {
		const otpReqId = await this.otpService.sendOtp(otpReqBody);
		return ApiDataFactory.create(new OtpSendResponse(otpReqId));
	}

	@Post('verify')
	@Response(204, 'Success')
	public async verifyOtp(@Body() otpVerifyBody: OtpVerifyRequest): Promise<void> {
		await this.otpService.verifyOtp(otpVerifyBody);
		this.mobileOtpCookieHelper.setCookieValue({
			cookieCreatedAt: new Date(),
			otpReqId: otpVerifyBody.otpRequestId,
		});
		this.setStatus(204);
	}
}
