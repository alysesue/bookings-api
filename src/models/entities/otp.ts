import { getConfig } from './../../config/app-config';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import * as uuid from 'uuid';

const OTP_DIGITS = '0123456789';
const OTP_LENGTH = 6;
// const OTP_EXPIRY_IN_SECONDS = 3 * 60;

@Entity('otp')
export class Otp {
	@PrimaryGeneratedColumn()
	_id: number;

	@Column()
	@Index({ unique: true })
	_requestId: string;

	@Column()
	_mobileNo: string; // stored as a string so that i can store +65xxxxxxxxs

	@Column()
	_value: string;

	@Column()
	_createdAt: Date;

	static create(mobileNo: string): Otp {
		const otp = new Otp();
		otp._requestId = uuid.v4();
		otp._mobileNo = mobileNo;
		let otpCode = '';
		if (getConfig().otpEnabled) {
			for (let i = 0; i < OTP_LENGTH; i++) {
				const index = Math.floor(Math.random() * OTP_DIGITS.length);
				otpCode += OTP_DIGITS[index];
			}
		} else {
			otpCode = '111111';
		}

		otp._value = otpCode;
		otp._createdAt = new Date();

		return otp;
	}
}
