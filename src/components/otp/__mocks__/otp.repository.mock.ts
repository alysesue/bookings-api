import { Otp } from './../../../models/entities/otp';
import { OtpRepository } from '../otp.repository';

export class OtpRepositoryMock implements Partial<OtpRepository> {
	static saveMock = jest.fn<Promise<Otp>, any>();

	static getNonExpiredOtpMock = jest.fn<Promise<Otp | undefined>, any>();

	static getMobileNoMock = jest.fn<Promise<string | undefined>, any>();

	async save(...params): Promise<Otp> {
		return await OtpRepositoryMock.saveMock(...params);
	}

	async getNonExpiredOtp(...params): Promise<Otp | undefined> {
		return await OtpRepositoryMock.getNonExpiredOtpMock(...params);
	}

	async getMobileNo(...params): Promise<string | undefined> {
		return await OtpRepositoryMock.getMobileNoMock(...params);
	}
}
