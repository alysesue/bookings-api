import { NotificationSMSService } from '../notificationSMS/notificationSMS.service';
import { Inject, InRequestScope } from 'typescript-ioc';
import { Otp } from '../../models/entities/otp';
import { OtpRepository } from './otp.repository';
import { getConfig } from '../../config/app-config';
import { OtpSendRequest } from './otp.apicontract';
import { CaptchaService } from '../captcha/captcha.service';
import { BusinessError } from '../../errors/businessError';
import { BookingBusinessValidations } from '../bookings/validator/bookingBusinessValidations';
// import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';

@InRequestScope
export class OtpService {
	@Inject
	private otpRepository: OtpRepository;

	public async sendOtp(request: OtpSendRequest): Promise<string> {
		if (!getConfig().isAutomatedTest) {
			const res = await CaptchaService.verify(request.captchaToken, request.captchaOrigin);
			if (!res) {
				BusinessError.throw([BookingBusinessValidations.InvalidCaptchaToken]);
			}
		}

		const otp = Otp.create(request.mobileNo);
		await new NotificationSMSService().send({
			phoneNumber: request.mobileNo,
			message: `Your authentication code is ${otp._value}`,
		});
		await this.otpRepository.save(otp);

		return otp._requestId;
	}
}
