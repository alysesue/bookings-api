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
}
