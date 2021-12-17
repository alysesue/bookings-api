import { MobileOtpCookieHelper, MolCookieHelper } from './../../infrastructure/bookingSGCookieHelper';
import { ApiDataFactory, ApiData } from './../../apicontract';
import { OtpSendRequest, OtpSendResponse, OtpVerifyRequest } from './otp.apicontract';
import { Controller, Post, Route, Tags, SuccessResponse, Body, Response } from 'tsoa';
import { Inject } from 'typescript-ioc';
import { OtpService } from '../otp/otp.service';
import { BookingSGAuth } from '../../infrastructure/decorators/bookingSGAuth';
import { IdHasher } from '../../infrastructure/idHasher';
import { ServicesService } from '../services/services.service';
import {BookingsService} from "../bookings";

@Route('v1/otp')
@Tags('Otp')
export class OtpController extends Controller {
	@Inject
	private otpService: OtpService;
	@Inject
	private mobileOtpCookieHelper: MobileOtpCookieHelper;
	@Inject
	private molCookieHelper: MolCookieHelper;
	@Inject
	private idHasher: IdHasher;
	@Inject
	private servicesService: ServicesService;
	@Inject
	private bookingsService: BookingsService;

	@Post('send')
	@BookingSGAuth({ bypassAuth: true })
	@SuccessResponse(200, 'Success')
	public async sendOtp(@Body() otpReqBody: OtpSendRequest): Promise<ApiData<OtpSendResponse>> {
		let serviceId;
		let organisationName;
		if(otpReqBody.serviceId) {
			const unsignedServiceId = this.idHasher.decode(otpReqBody.serviceId);
			serviceId = unsignedServiceId;
			const service = await this.servicesService.getService(unsignedServiceId, {}, true);
			organisationName = service.organisation.name;
		}
		if(otpReqBody.bookingToken) {
			const booking = await this.bookingsService.getBookingByUUID(otpReqBody.bookingToken);
			serviceId = booking.serviceId;
			const service = await this.servicesService.getService(serviceId, {}, true);
			organisationName = service.organisation.name;
		}
		const otpReqId = await this.otpService.sendOtp(
			{ ...otpReqBody, serviceId },
			organisationName,
		);
		return ApiDataFactory.create(new OtpSendResponse(otpReqId));
	}

	@Post('verify')
	@BookingSGAuth({ bypassAuth: true })
	@Response(204, 'Success')
	public async verifyOtp(@Body() otpVerifyBody: OtpVerifyRequest): Promise<void> {
		await this.otpService.verifyOtp(otpVerifyBody);
		this.mobileOtpCookieHelper.setCookieValue({
			cookieCreatedAt: new Date(),
			cookieRefreshedAt: new Date(),
			otpReqId: otpVerifyBody.otpRequestId,
		});
		this.molCookieHelper.delete();
		this.setStatus(204);
	}

	@Post('refresh-token')
	@BookingSGAuth({ bypassAuth: true })
	@Response(204, 'Success')
	public async refreshOtpToken(): Promise<void> {
		await this.otpService.verifyAndRefreshToken();
		this.setStatus(204);
	}
}
