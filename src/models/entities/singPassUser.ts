import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { ISingPassUser } from "../interfaces";

@Entity()
export class SingPassUser implements ISingPassUser {
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

	@Column()
	@Index({ unique: true })
	private _UinFin: string;

	public get UinFin(): string {
		return this._UinFin;
	}

	public set UinFin(value: string) {
		this._UinFin = value;
	}

	@Column()
	@Index({ unique: true })
	private _molUserId: string;

	public get molUserId() {
		return this._molUserId;
	}

	public set molUserId(molUserId: string) {
		this._molUserId = molUserId;
	}

	public static create(molUserId: string, UinFin: string) {
		const instance = new SingPassUser();
		instance.molUserId = molUserId;
		instance.UinFin = UinFin;
		return instance;
	}
}
