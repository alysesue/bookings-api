import { OtpService } from './../otp.service';
export class OtpServiceMock implements Partial<OtpService> {
	static sendOtpMock = jest.fn<Promise<string>, any>();
	static verifyOtpMock = jest.fn<Promise<void>, any>();
	static getMobileNoMock = jest.fn<Promise<string | undefined>, any>();
	static verifyAndRefreshTokenMock = jest.fn<Promise<void>, any>();

	async sendOtp(...params): Promise<string> {
		return await OtpServiceMock.sendOtpMock(...params);
	}

	async verifyOtp(...params): Promise<void> {
		return await OtpServiceMock.verifyOtpMock(...params);
	}

	async getMobileNo(...params): Promise<string | undefined> {
		return await OtpServiceMock.getMobileNoMock(...params);
	}

	async verifyAndRefreshToken(): Promise<void> {
		await OtpServiceMock.verifyAndRefreshTokenMock();
	}
}
