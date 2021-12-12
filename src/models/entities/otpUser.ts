import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IUser } from '../interfaces';

@Entity()
export class OtpUser {
	constructor() {}

	@PrimaryGeneratedColumn()
	private _id: number;

	public get id(): number {
		return this._id;
	}

	public set id(value: number) {
		this._id = value;
	}

	@OneToOne('User', { nullable: false })
	@JoinColumn({ name: '_userId' })
	public _User: IUser;

	@Column({ nullable: false })
	private _mobileNo: string;

	public get mobileNo(): string {
		return this._mobileNo;
	}

	public set mobileNo(value: string) {
		this._mobileNo = value;
	}

	public static create(mobileNo: string): OtpUser {
		if (!mobileNo) return null;
		const instance = new OtpUser();
		instance._mobileNo = mobileNo;
		return instance;
	}
}
