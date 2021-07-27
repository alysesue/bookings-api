import { ApiDataFactory, ApiData } from './../../apicontract';
import { OtpSendRequest, OtpSendResponse } from './otp.apicontract';
import { Controller, Post, Route, Tags, SuccessResponse, Body } from 'tsoa';
import { Inject } from 'typescript-ioc';
import { OtpService } from '../otp/otp.service';

@Route('v1/otp')
@Tags('Otp')
export class OtpController extends Controller {
	@Inject
	private otpService: OtpService;

	@Post('send')
	@SuccessResponse(200, 'Success')
	public async sendOtp(@Body() otpReqBody: OtpSendRequest): Promise<ApiData<OtpSendResponse>> {
		const otpReqId = await this.otpService.sendOtp(otpReqBody);
		return ApiDataFactory.create(new OtpSendResponse(otpReqId));
	}
}
