import { OtpServiceMock } from './../__mocks__/otp.service.mock';
import { MobileOtpCookieHelper } from './../../../infrastructure/bookingSGCookieHelper';
import { OtpVerifyRequest } from './../otp.apicontract';
import { OtpController } from '../otp.controller';
import { Container } from 'typescript-ioc';
import { OtpSendRequest } from '../otp.apicontract';
import { OtpService } from '../otp.service';
import * as uuid from 'uuid';
import { MobileOtpCookieHelperMock } from '../../../infrastructure/__mocks__/mobileOtpCookieHelper.mock';

beforeAll(() => {
	Container.bind(OtpService).to(OtpServiceMock);
	Container.bind(MobileOtpCookieHelper).to(MobileOtpCookieHelperMock);
});

beforeEach(() => {
	OtpServiceMock.sendOtpMock.mockImplementation(
		async (): Promise<string> => {
			return Promise.resolve(uuid.v4());
		},
	);
});

afterEach(() => {
	jest.resetAllMocks();
});

describe('OTP controller', () => {
	it('sends OTP for mobile login', async () => {
		const controller = Container.get(OtpController);

		const otpSendResponse = await controller.sendOtp(new OtpSendRequest('+6588884444'));
		expect(OtpServiceMock.sendOtpMock).toBeCalledTimes(1);
		expect(uuid.validate(otpSendResponse.data.otpRequestId)).toBeTruthy();
	});

	it('verify OTP for mobile login', async () => {
		const controller = Container.get(OtpController);

		await controller.verifyOtp(new OtpVerifyRequest('6dd2513a-9679-49d2-b305-94a390d151ad', '011111'));
		expect(OtpServiceMock.verifyOtpMock).toBeCalledTimes(1);
		expect(MobileOtpCookieHelperMock.setCookieValue).toBeCalledTimes(1);
	});

	it('verify OTP and refresh token', async () => {
		const controller = Container.get(OtpController);

		await controller.refreshOtpToken();
		expect(OtpServiceMock.verifyAndRefreshTokenMock).toBeCalledTimes(1);
	});
});
