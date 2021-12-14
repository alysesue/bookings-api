import { NotificationSMSServiceMock } from './../../notificationSMS/__mocks__/notificationSMS.service.mock';
import { OtpRepository } from '../otp.repository';
import { BusinessError } from '../../../errors/businessError';
import { OtpSendRequestServiceIdNumber, OtpVerifyRequest} from '../otp.apicontract';
import { OtpService } from '../otp.service';
import { CaptchaService } from '../../captcha/captcha.service';
import * as appConfig from '../../../config/app-config';
import { BookingBusinessValidations } from '../../bookings/validator/bookingBusinessValidations';
import { Organisation, Otp } from '../../../models';
import { Container } from 'typescript-ioc';
import { NotificationSMSService } from '../../../components/notificationSMS/notificationSMS.service';
import { CaptchaServiceMock } from '../../../components/captcha/__mocks__/captcha.service.mock';
import { OtpRepositoryMock } from '../__mocks__/otp.repository.mock';
import { MobileOtpCookieHelperMock } from '../../../infrastructure/__mocks__/mobileOtpCookieHelper.mock';
import { MobileOtpCookieHelper } from '../../../infrastructure/bookingSGCookieHelper';
import { getConfig } from '../../../config/app-config';

jest.mock('../../../config/app-config', () => ({
	getConfig: jest.fn(),
}));

const organisation = Organisation.create('Organisation1', 1);

describe('sendOtp()', () => {
	let configSpy: jest.SpyInstance;
	let otpRepoSaveSpy: jest.SpyInstance;

	beforeAll(() => {
		Container.bind(CaptchaService).to(CaptchaServiceMock);
		Container.bind(NotificationSMSService).to(NotificationSMSServiceMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		configSpy = jest.spyOn(appConfig, 'getConfig');
		otpRepoSaveSpy = jest.spyOn(OtpRepository.prototype, 'save');
		otpRepoSaveSpy.mockImplementation((otp): Promise<Otp> => {
			return Promise.resolve(otp);
		});

		NotificationSMSServiceMock.sendMock.mockResolvedValue();
		configSpy.mockReturnValue({ otpEnabled: true });
	});

	it('should verify recaptcha, not throw error when recaptcha passes and send otp', async () => {
		CaptchaServiceMock.verify.mockReturnValue(Promise.resolve(true));

		const otpSvc = Container.get(OtpService);
		await otpSvc.sendOtp(new OtpSendRequestServiceIdNumber('+6588884444', 'captchaToken', 1), organisation.name);

		expect(async () => otpSvc.sendOtp(new OtpSendRequestServiceIdNumber('+6588884444', 'captchaToken', 1), organisation.name)).not.toThrow();
		expect(CaptchaServiceMock.verify).toBeCalledWith('captchaToken');
		expect(NotificationSMSServiceMock.sendMock).toBeCalledTimes(1);
		expect(otpRepoSaveSpy).toBeCalledTimes(1);
	});

	it('should throw error when recaptcha failed and NOT send otp', async () => {
		CaptchaServiceMock.verify.mockReturnValue(Promise.resolve(false));

		const otpSvc = Container.get(OtpService);

		await expect(async () => otpSvc.sendOtp(new OtpSendRequestServiceIdNumber('+6588884444', 'captchaToken', 1), organisation.name)).rejects.toThrow(
			BusinessError.create([BookingBusinessValidations.InvalidCaptchaToken]),
		);
		expect(CaptchaServiceMock.verify).toBeCalledWith('captchaToken');
		expect(NotificationSMSServiceMock.sendMock).not.toBeCalled();
		expect(otpRepoSaveSpy).not.toBeCalled();
	});
});

describe('verifyOtp()', () => {
	let configSpy: jest.SpyInstance;

	beforeAll(() => {
		Container.bind(CaptchaService).to(CaptchaServiceMock);
		Container.bind(OtpRepository).to(OtpRepositoryMock);
		Container.bind(NotificationSMSService).to(NotificationSMSServiceMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();

		configSpy = jest.spyOn(appConfig, 'getConfig');
		configSpy.mockReturnValue({ otpEnabled: true });
	});

	it('should throw error when recaptcha failed and NOT verify otp', async () => {
		CaptchaServiceMock.verify.mockReturnValue(Promise.resolve(false));

		const otpSvc = Container.get(OtpService);

		await expect(async () =>
			otpSvc.verifyOtp(new OtpVerifyRequest('xxx', '111111', 'captchaToken')),
		).rejects.toThrow(BusinessError.create([BookingBusinessValidations.InvalidCaptchaToken]));

		expect(CaptchaServiceMock.verify).toBeCalledWith('captchaToken');
		expect(OtpRepositoryMock.getNonExpiredOtpMock).not.toBeCalled();
	});

	it('when recaptcha passes, it should throw error when there is no existingOtp', async () => {
		CaptchaServiceMock.verify.mockReturnValue(Promise.resolve(true));
		OtpRepositoryMock.getNonExpiredOtpMock.mockReturnValue(undefined);
		const otpSvc = Container.get(OtpService);

		await expect(
			async () => await otpSvc.verifyOtp(new OtpVerifyRequest('xxx', '111111', 'captchaToken')),
		).rejects.toThrowErrorMatchingInlineSnapshot(`"Invalid otp code."`);

		expect(CaptchaServiceMock.verify).toBeCalledWith('captchaToken');
		expect(OtpRepositoryMock.getNonExpiredOtpMock).toBeCalledTimes(1);
	});

	it('when recaptcha passes, it should throw error when otp mismatch', async () => {
		CaptchaServiceMock.verify.mockReturnValue(Promise.resolve(true));
		const otp = Otp.create('+6588884444');
		otp._requestId = 'xxx';
		otp._value = '111111';
		OtpRepositoryMock.getNonExpiredOtpMock.mockReturnValue(Promise.resolve(otp));
		const otpSvc = Container.get(OtpService);

		await expect(
			async () => await otpSvc.verifyOtp(new OtpVerifyRequest('xxx', '111112', 'captchaToken')),
		).rejects.toThrowErrorMatchingInlineSnapshot(`"Invalid otp code."`);

		expect(CaptchaServiceMock.verify).toBeCalledWith('captchaToken');
		expect(OtpRepositoryMock.getNonExpiredOtpMock).toBeCalledTimes(1);
	});

	it('when recaptcha passes, it does not throw error when otp matches', async () => {
		CaptchaServiceMock.verify.mockReturnValue(Promise.resolve(true));
		const otp = Otp.create('+6588884444');
		otp._requestId = 'xxx';
		otp._value = '111111';
		OtpRepositoryMock.getNonExpiredOtpMock.mockReturnValue(Promise.resolve(otp));
		const otpSvc = Container.get(OtpService);

		expect(async () => {
			await otpSvc.verifyOtp(new OtpVerifyRequest('xxx', '111111', 'captchaToken'));
			expect(CaptchaServiceMock.verify).toBeCalledWith('captchaToken');
			expect(OtpRepositoryMock.getNonExpiredOtpMock).toBeCalledTimes(1);
		}).not.toThrowError();
	});
});

describe('getMobileNo', () => {
	beforeAll(() => {
		Container.bind(OtpRepository).to(OtpRepositoryMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should call otpRepository', async () => {
		OtpRepositoryMock.getMobileNoMock.mockReturnValue(Promise.resolve('xxx'));
		const mobileNo = await Container.get(OtpService).getMobileNo('yyy');
		expect(mobileNo).toEqual('xxx');
		expect(OtpRepositoryMock.getMobileNoMock).toBeCalledTimes(1);
	});
});

describe('verifyAndRefreshToken', () => {
	beforeAll(() => {
		Container.bind(OtpRepository).to(OtpRepositoryMock);
		Container.bind(MobileOtpCookieHelper).to(MobileOtpCookieHelperMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('token request invalid', async () => {
		const container = Container.get(OtpService);
		(getConfig as jest.Mock).mockReturnValue({
			otpEnabled: false,
		});

		MobileOtpCookieHelperMock.getCookieValue.mockReturnValue({
			cookieCreatedAt: new Date(),
			cookieRefreshedAt: new Date(),
			otpReqId: '8db0ef50-2e3d-4eb8-83bf-16a8c9ea545f',
		});
		OtpRepositoryMock.getByOtpReqIdMock.mockReturnValue(Promise.resolve(undefined));

		let error;
		try {
			await container.verifyAndRefreshToken();
		} catch (e) {
			error = e;
		}

		expect(MobileOtpCookieHelperMock.getCookieValue).toBeCalledTimes(1);
		expect(OtpRepositoryMock.getByOtpReqIdMock).toBeCalledTimes(1);
		expect(error.code).toBe(`SYS_INVALID_PARAM`);
		expect(error.httpStatusCode).toBe(400);
		expect(error.message).toBe(`Invalid request token.`);
	});

	it('token expired, no refresh', async () => {
		const container = Container.get(OtpService);
		(getConfig as jest.Mock).mockReturnValue({
			otpEnabled: false,
		});

		MobileOtpCookieHelperMock.getCookieValue.mockReturnValue({
			cookieCreatedAt: new Date(),
			cookieRefreshedAt: new Date(),
			otpReqId: '8db0ef50-2e3d-4eb8-83bf-16a8c9ea545f',
		});
		OtpRepositoryMock.getByOtpReqIdMock.mockReturnValue(Promise.resolve(Otp.create(`+6581118222`)));
		MobileOtpCookieHelperMock.isCookieValid.mockReturnValue(false);

		await container.verifyAndRefreshToken();

		expect(MobileOtpCookieHelperMock.getCookieValue).toBeCalledTimes(1);
		expect(OtpRepositoryMock.getByOtpReqIdMock).toBeCalledTimes(1);
		expect(MobileOtpCookieHelperMock.isCookieValid).toBeCalledTimes(1);
		expect(MobileOtpCookieHelperMock.setCookieValue).not.toBeCalled();
	});

	it('token refreshed', async () => {
		const container = Container.get(OtpService);
		(getConfig as jest.Mock).mockReturnValue({
			otpEnabled: false,
		});

		MobileOtpCookieHelperMock.getCookieValue.mockReturnValue({
			cookieCreatedAt: new Date(),
			cookieRefreshedAt: new Date(),
			otpReqId: '8db0ef50-2e3d-4eb8-83bf-16a8c9ea545f',
		});
		OtpRepositoryMock.getByOtpReqIdMock.mockReturnValue(Promise.resolve(Otp.create(`+6581118222`)));
		MobileOtpCookieHelperMock.isCookieValid.mockReturnValue(true);

		await container.verifyAndRefreshToken();

		expect(MobileOtpCookieHelperMock.getCookieValue).toBeCalledTimes(1);
		expect(OtpRepositoryMock.getByOtpReqIdMock).toBeCalledTimes(1);
		expect(MobileOtpCookieHelperMock.isCookieValid).toBeCalledTimes(1);
		expect(MobileOtpCookieHelperMock.setCookieValue).toBeCalledTimes(1);
	});
});
