import { Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { IUser } from "../interfaces";
import { SingPassUser } from "./singPassUser";

@Entity()
export class User implements IUser {
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

	@OneToOne(type => SingPassUser, e => e._User, { cascade: true })
	public _singPassUser: SingPassUser;

	public get singPassUser(): SingPassUser {
		return this._singPassUser;
	}

	public set singPassUser(value: SingPassUser) {
		this._singPassUser = value;
	}

	public static createSingPassUser(molUserId: string, userUinFin: string) {
		const instance = new User();
		instance.singPassUser = SingPassUser.create(molUserId, userUinFin);
		return instance;
	}
}