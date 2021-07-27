import { MobileOtpCookieHelper } from './../../../infrastructure/bookingSGCookieHelper';
import { OtpVerifyRequest } from './../otp.apicontract';
import { OtpController } from '../otp.controller';
import { Container } from 'typescript-ioc';
import { OtpSendRequest } from '../otp.apicontract';
import { OtpService } from '../otp.service';
import * as uuid from 'uuid';

const OtpServiceMock = {
	sendOtp: jest.fn(),
	verifyOtp: jest.fn(),
};

const MobileOtpCookieHelperMock = {
	setCookieValue: jest.fn(),
};

beforeAll(() => {
	Container.bind(OtpService).factory(() => OtpServiceMock);
	Container.bind(MobileOtpCookieHelper).factory(() => MobileOtpCookieHelperMock);
});

beforeEach(() => {
	OtpServiceMock.sendOtp.mockImplementation(
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
		expect(OtpServiceMock.sendOtp).toBeCalledTimes(1);
		expect(uuid.validate(otpSendResponse.data.otpRequestId)).toBeTruthy();
	});

	it('verify OTP for mobile login', async () => {
		const controller = Container.get(OtpController);

		await controller.verifyOtp(new OtpVerifyRequest('6dd2513a-9679-49d2-b305-94a390d151ad', 111111));
		expect(OtpServiceMock.verifyOtp).toBeCalledTimes(1);
		expect(MobileOtpCookieHelperMock.setCookieValue).toBeCalledTimes(1);
	});
});
