import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { IUser } from "../interfaces";

@Entity()
export class SingPassUser {
	constructor() {
	}

	@PrimaryGeneratedColumn()
	private _id: number;

	public get id(): number {
		return this._id;
	}

	public set id(value: number) {
		this._id = value;
	}

	@OneToOne('User', { nullable: false })
	@JoinColumn({ name: "_userId" })
	public _User: IUser;

	@Column({ nullable: false, type: "varchar", length: 20 })
	@Index({ unique: true })
	private _UinFin: string;

	public get UinFin(): string {
		return this._UinFin;
	}

	public set UinFin(value: string) {
		this._UinFin = value;
	}

	@Column({ type: "uuid" })
	@Index({ unique: true })
	private _molUserId: string;

	public get molUserId() {
		return this._molUserId;
	}

	public set molUserId(molUserId: string) {
		this._molUserId = molUserId;
	}

	public static create(molUserId: string, UinFin: string): SingPassUser {
		const instance = new SingPassUser();
		instance.molUserId = molUserId;
		instance.UinFin = UinFin;
		return instance;
	}
}
