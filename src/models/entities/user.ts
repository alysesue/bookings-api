import { Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { IUser } from "../interfaces";
import { SingPassUser } from "./singPassUser";
import { AdminUser } from "./adminUser";

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

	@OneToOne(type => SingPassUser, e => e._User, { cascade: true, nullable: true })
	public _singPassUser: SingPassUser;

	public get singPassUser(): SingPassUser {
		return this._singPassUser;
	}

	public set singPassUser(value: SingPassUser) {
		this._singPassUser = value;
	}

	@OneToOne(type => AdminUser, e => e._User, { cascade: true, nullable: true })
	public _adminUser: AdminUser;

	public get adminUser(): AdminUser {
		return this._adminUser;
	}

	public set adminUser(value: AdminUser) {
		this._adminUser = value;
	}

	public isCitizen(): boolean {
		return !!this._singPassUser;
	}

	public isAdmin(): boolean {
		return !!this._adminUser;
	}

	public static createSingPassUser(molUserId: string, userUinFin: string): User {
		const instance = new User();
		instance.singPassUser = SingPassUser.create(molUserId, userUinFin);
		return instance;
	}

	public static createAdminUser(data: {
		molAdminId: string;
		userName: string;
		email: string;
		name: string;
	}): User {
		const instance = new User();
		instance.adminUser = AdminUser.create(data);
		return instance;
	}
}
