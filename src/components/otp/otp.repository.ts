import { DateHelper } from './../../infrastructure/dateHelper';
import { Otp } from './../../models/entities/otp';
import { RepositoryBase } from '../../core/repository';
import { InRequestScope } from 'typescript-ioc';

@InRequestScope
export class OtpRepository extends RepositoryBase<Otp> {
	constructor() {
		super(Otp);
	}

	public async save(otp: Otp): Promise<Otp> {
		return (await this.getRepository()).save(otp);
	}

	public async getNonExpiredOtp(otpReqId: string, expiryInSeconds: number): Promise<Otp | undefined> {
		const otp = await (await this.getRepository()).findOne({ where: { _requestId: otpReqId } });
		// using Date.now so that i can mock and test this easily
		if (otp !== undefined && DateHelper.DiffInSeconds(new Date(Date.now()), otp._createdAt) <= expiryInSeconds) {
			return otp;
		}
		return undefined;
	}
}
