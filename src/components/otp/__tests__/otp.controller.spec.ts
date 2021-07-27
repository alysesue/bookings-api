import { OtpController } from '../otp.controller';
import { Container } from 'typescript-ioc';
import { OtpSendRequest } from '../otp.apicontract';
import { OtpService } from '../otp.service';
import * as uuid from 'uuid';

const OtpServiceMock = {
	sendOtp: jest.fn(),
};

beforeAll(() => {
	Container.bind(OtpService).factory(() => OtpServiceMock);
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
});
