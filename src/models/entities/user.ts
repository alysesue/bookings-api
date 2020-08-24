import { Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ISingPassUser, IUser } from "../interfaces";
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

	@OneToOne(type => SingPassUser, { cascade: true })
	private _singPassUser: ISingPassUser;

	public get singPassUser(): ISingPassUser {
		return this._singPassUser;
	}

	public set singPassUser(value: ISingPassUser) {
		this._singPassUser = value;
	}

	public static createSingPassUser(molUserId: string, userUinFin: string) {
		const instance = new User();
		instance.singPassUser = SingPassUser.create(molUserId, userUinFin);
		return instance;
	}
}