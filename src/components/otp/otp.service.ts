import { NotificationSMSService } from '../notificationSMS/notificationSMS.service';
import { Inject, InRequestScope } from 'typescript-ioc';
import { Otp } from '../../models/entities/otp';
import { OtpRepository } from './otp.repository';
import { OtpSendRequestServiceIdNumber, OtpVerifyRequest} from './otp.apicontract';
import { CaptchaService } from '../captcha/captcha.service';
import { BusinessError } from '../../errors/businessError';
import { BookingBusinessValidations } from '../bookings/validator/bookingBusinessValidations';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { MobileOtpCookieHelper } from '../../infrastructure/bookingSGCookieHelper';
import { BookingValidationType } from '../../models';
import { SMSType } from "../../models/SMSType";

const OTP_EXPIRY_IN_SECONDS = 3 * 60;

@InRequestScope
export class OtpService {
	@Inject
	private otpRepository: OtpRepository;
	@Inject
	private captchaService: CaptchaService;
	@Inject
	private notificationSMSService: NotificationSMSService;
	@Inject
	private mobileOtpCookieHelper: MobileOtpCookieHelper;

	async sendOtp(request: OtpSendRequestServiceIdNumber, organisationName: string): Promise<string> {
		const res = await this.captchaService.verify(request.captchaToken);
		if (!res) {
			BusinessError.throw([BookingBusinessValidations.InvalidCaptchaToken]);
		}

		const otp = Otp.create(request.mobileNo);
		await this.notificationSMSService.send(
			{
				phoneNumber: request.mobileNo,
				message: `Your authentication code is ${otp._value}`,
			},
			organisationName,
			request.serviceId,
			BookingValidationType.Citizen,
			SMSType.Login,
		);
		await this.otpRepository.save(otp);

		return otp._requestId;
	}

	async verifyOtp(request: OtpVerifyRequest): Promise<void> {
		const res = await this.captchaService.verify(request.captchaToken);
		if (!res) {
			BusinessError.throw([BookingBusinessValidations.InvalidCaptchaToken]);
		}

		const existingOtp = await this.otpRepository.getNonExpiredOtp(request.otpRequestId, OTP_EXPIRY_IN_SECONDS);
		if (existingOtp === undefined || existingOtp._value !== request.otpCode) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Invalid otp code.`);
		}
	}

	async getMobileNo(otpReqId: string): Promise<string | undefined> {
		return await this.otpRepository.getMobileNo(otpReqId);
	}

	async verifyAndRefreshToken(): Promise<void> {
		const cookie = this.mobileOtpCookieHelper.getCookieValue();
		const otp = await this.otpRepository.getByOtpReqId(cookie.otpReqId);

		if (!otp) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(`Invalid request token.`);
		}

		if (this.mobileOtpCookieHelper.isCookieValid(cookie)) {
			this.mobileOtpCookieHelper.setCookieValue({
				cookieCreatedAt: cookie.cookieCreatedAt,
				cookieRefreshedAt: new Date(),
				otpReqId: cookie.otpReqId,
			});
		}
	}
}
