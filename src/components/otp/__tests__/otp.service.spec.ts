import { OtpRepository } from '../otp.repository';
import { BusinessError } from '../../../errors/businessError';
import { OtpSendRequest } from '../otp.apicontract';
import { OtpService } from '../otp.service';
import { CaptchaService } from '../../captcha/captcha.service';
import * as appConfig from '../../../config/app-config';
import { BookingBusinessValidations } from '../../bookings/validator/bookingBusinessValidations';
import { Otp } from '../../../models';
import { Container } from 'typescript-ioc';
import { NotificationSMSService } from '../../../components/notificationSMS/notificationSMS.service';

describe('sendOtp()', () => {
	let configSpy: jest.SpyInstance;
	let captchaServiceVerifySpy: jest.SpyInstance;
	let otpRepoSaveSpy: jest.SpyInstance;
	let notificationSMSSvcSpy: jest.SpyInstance;

	beforeEach(() => {
		configSpy = jest.spyOn(appConfig, 'getConfig');
		captchaServiceVerifySpy = jest.spyOn(CaptchaService, 'verify');
		otpRepoSaveSpy = jest.spyOn(OtpRepository.prototype, 'save');
		otpRepoSaveSpy.mockImplementation(
			(otp): Promise<Otp> => {
				return Promise.resolve(otp);
			},
		);

		notificationSMSSvcSpy = jest.spyOn(NotificationSMSService.prototype, 'send');
		notificationSMSSvcSpy.mockImplementation(
			(): Promise<void> => {
				return Promise.resolve();
			},
		);
	});

	afterEach(() => {
		configSpy.mockRestore();
		captchaServiceVerifySpy.mockRestore();
		otpRepoSaveSpy.mockRestore();
		notificationSMSSvcSpy.mockRestore();
	});

	describe('when IS_AUTOMATED_TEST=false', () => {
		beforeEach(() => {
			configSpy.mockReturnValue({ ...appConfig.getConfig(), isAutomatedTest: false });
		});

		it('should verify recaptcha, not throw error when recaptcha passes and send otp', async () => {
			captchaServiceVerifySpy.mockImplementation(
				(): Promise<boolean> => {
					return Promise.resolve(true);
				},
			);

			const userSessionSvc = Container.get(OtpService);
			await userSessionSvc.sendOtp(new OtpSendRequest('+6588884444', 'captchaToken', 'captchaOrigin'));

			expect(async () =>
				userSessionSvc.sendOtp(new OtpSendRequest('+6588884444', 'captchaToken', 'captchaOrigin')),
			).not.toThrow();
			expect(captchaServiceVerifySpy).toBeCalledWith('captchaToken', 'captchaOrigin');
			expect(notificationSMSSvcSpy).toBeCalledTimes(1);
			expect(otpRepoSaveSpy).toBeCalledTimes(1);
		});

		it('should throw error when recaptcha failed and NOT send otp', async () => {
			captchaServiceVerifySpy.mockImplementation(
				(): Promise<boolean> => {
					return Promise.resolve(false);
				},
			);

			const userSessionSvc = Container.get(OtpService);

			await expect(async () =>
				userSessionSvc.sendOtp(new OtpSendRequest('+6588884444', 'captchaToken', 'captchaOrigin')),
			).rejects.toThrow(BusinessError.create([BookingBusinessValidations.InvalidCaptchaToken]));
			expect(captchaServiceVerifySpy).toBeCalledWith('captchaToken', 'captchaOrigin');
			expect(notificationSMSSvcSpy).not.toBeCalled();
			expect(otpRepoSaveSpy).not.toBeCalled();
		});
	});

	describe('when IS_AUTOMATED_TEST=true', () => {
		it('should not verify recaptcha and send otp', async () => {
			configSpy.mockReturnValue({ ...appConfig.getConfig(), isAutomatedTest: true });

			const userSessionSvc = Container.get(OtpService);
			await userSessionSvc.sendOtp(new OtpSendRequest('+6588884444', 'captchaToken', 'captchaOrigin'));

			expect(captchaServiceVerifySpy).toBeCalledTimes(0);
			expect(notificationSMSSvcSpy).toBeCalledTimes(1);
			expect(otpRepoSaveSpy).toBeCalledTimes(1);
		});
	});
});
