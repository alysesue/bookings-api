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
import { CaptchaServiceMock } from '../../../components/captcha/__mocks__/captcha.service.mock';

describe('sendOtp()', () => {
	let configSpy: jest.SpyInstance;
	let otpRepoSaveSpy: jest.SpyInstance;
	let notificationSMSSvcSpy: jest.SpyInstance;

	beforeAll(() => {
		Container.bind(CaptchaService).to(CaptchaServiceMock);
	});

	beforeEach(() => {
		configSpy = jest.spyOn(appConfig, 'getConfig');
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
		CaptchaServiceMock.verify.mockReset();
		otpRepoSaveSpy.mockRestore();
		notificationSMSSvcSpy.mockRestore();
	});

	beforeEach(() => {
		configSpy.mockReturnValue({ otpEnabled: true });
	});

	it('should verify recaptcha, not throw error when recaptcha passes and send otp', async () => {
		CaptchaServiceMock.verify.mockReturnValue(Promise.resolve(true));

		const userSessionSvc = Container.get(OtpService);
		await userSessionSvc.sendOtp(new OtpSendRequest('+6588884444', 'captchaToken'));

		expect(async () => userSessionSvc.sendOtp(new OtpSendRequest('+6588884444', 'captchaToken'))).not.toThrow();
		expect(CaptchaServiceMock.verify).toBeCalledWith('captchaToken');
		expect(notificationSMSSvcSpy).toBeCalledTimes(1);
		expect(otpRepoSaveSpy).toBeCalledTimes(1);
	});

	it('should throw error when recaptcha failed and NOT send otp', async () => {
		CaptchaServiceMock.verify.mockReturnValue(Promise.resolve(false));

		const userSessionSvc = Container.get(OtpService);

		await expect(async () =>
			userSessionSvc.sendOtp(new OtpSendRequest('+6588884444', 'captchaToken')),
		).rejects.toThrow(BusinessError.create([BookingBusinessValidations.InvalidCaptchaToken]));
		expect(CaptchaServiceMock.verify).toBeCalledWith('captchaToken');
		expect(notificationSMSSvcSpy).not.toBeCalled();
		expect(otpRepoSaveSpy).not.toBeCalled();
	});
});
