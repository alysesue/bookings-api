import { Otp } from '../entities';
import * as appConfig from '../../config/app-config';

describe('OTP constructor', () => {
	it('should generate a random 6 digit one time password when OTP_ENABLED=true', () => {
		jest.spyOn(appConfig, 'getConfig').mockReturnValue({ ...appConfig.getConfig(), otpEnabled: true });
		jest.spyOn(global.Math, 'random')
			.mockReturnValueOnce(0.1)
			.mockReturnValueOnce(0.2)
			.mockReturnValueOnce(0.3)
			.mockReturnValueOnce(0.4)
			.mockReturnValueOnce(0.5)
			.mockReturnValueOnce(0.6);
		const currDateTime = new Date();
		jest.spyOn(global, 'Date').mockReturnValue(currDateTime as unknown as string); // https://stackoverflow.com/a/63782059

		const otp = Otp.create('+6588884444');

		expect(otp._value).toEqual('123456');
		expect(otp._mobileNo).toEqual('+6588884444');
		expect(otp._createdAt).toEqual(currDateTime);
	});

	it('should generate an OTP value of 111111 when OTP_ENABLED=false', () => {
		jest.spyOn(appConfig, 'getConfig').mockReturnValue({ ...appConfig.getConfig(), otpEnabled: false });
		const currDateTime = new Date();
		jest.spyOn(global, 'Date').mockReturnValue(currDateTime as unknown as string); // https://stackoverflow.com/a/63782059

		const otp = Otp.create('+6588884444');

		expect(otp._value).toEqual('111111');
		expect(otp._mobileNo).toEqual('+6588884444');
		expect(otp._createdAt).toEqual(currDateTime);
	});

	afterEach(() => {
		jest.spyOn(global, 'Date').mockRestore();
		jest.spyOn(appConfig, 'getConfig').mockRestore();
		jest.spyOn(global.Math, 'random').mockRestore();
	});
});
