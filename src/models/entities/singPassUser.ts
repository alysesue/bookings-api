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
	private _molUserId: number;

	public get molUserId() {
		return this._molUserId;
	}

	public set molUserId(molUserId: number) {
		this._molUserId = molUserId;
	}

	@Column()
	@Index({ unique: true })
	private _UinFin: number;

	public get UinFin(): number {
		return this._UinFin;
	}

	public set UinFin(value: number) {
		this._UinFin = value;
	}
}
