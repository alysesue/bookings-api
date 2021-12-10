import {Entity, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import { IUser } from '../interfaces';
import { SingPassUser } from './singPassUser';
import { AdminUser } from './adminUser';
import { AgencyUser } from './agencyUser';
import { AnonymousUser } from './anonymousUser';

@Entity()
export class User implements IUser {
	constructor() {}

	@PrimaryGeneratedColumn()
	private _id: number;

	public get id(): number {
		return this._id;
	}

	public set id(value: number) {
		this._id = value;
	}

	@OneToOne(() => SingPassUser, (e) => e._User, { cascade: true, nullable: true })
	public _singPassUser: SingPassUser;

	public get singPassUser(): SingPassUser {
		return this._singPassUser;
	}

	public set singPassUser(value: SingPassUser) {
		this._singPassUser = value;
	}

	@OneToOne(() => AdminUser, (e) => e._User, { cascade: true, nullable: true })
	public _adminUser: AdminUser;

	public get adminUser(): AdminUser {
		return this._adminUser;
	}

	public set adminUser(value: AdminUser) {
		this._adminUser = value;
	}

	@OneToOne(() => AgencyUser, (e) => e._User, { cascade: true, nullable: true })
	public _agencyUser: AgencyUser;

	public get agencyUser(): AgencyUser {
		return this._agencyUser;
	}

	public set agencyUser(value: AgencyUser) {
		this._agencyUser = value;
	}

	@OneToOne(() => AnonymousUser, (e) => e._User, { cascade: true, nullable: true })
	public _anonymousUser: AnonymousUser;

	public get anonymousUser(): AnonymousUser {
		return this._anonymousUser;
	}

	public set anonymousUser(value: AnonymousUser) {
		this._anonymousUser = value;
	}

	public isSingPass(): boolean {
		return !!this._singPassUser;
	}

	public isAdmin(): boolean {
		return !!this._adminUser;
	}

	public isAgency(): boolean {
		return !!this._agencyUser;
	}

	public isAnonymous(): boolean {
		return !!this._anonymousUser;
	}

	public getTrackingId(): string {
		if (this.isAnonymous()) {
			return this.anonymousUser.trackingId;
		} else if (this.id) {
			return `${this.id}`;
		}

		throw new Error('Tracking id not implemented for this user type or user is not persisted yet.');
	}

	public isPersisted(): boolean {
		return !!this.id;
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
		agencyUserId?: string;
	}): User {
		const instance = new User();
		instance.adminUser = AdminUser.create(data);
		return instance;
	}

	public static createAgencyUser(data: { agencyAppId: string; agencyName: string }): User {
		const instance = new User();
		instance.agencyUser = AgencyUser.create(data);
		return instance;
	}

	public static createAnonymousUser(data: { createdAt: Date; trackingId: string; booking?: string }): User {
		const anonymousUser = AnonymousUser.create(data);
		if (!anonymousUser) {
			return null;
		}
		const instance = new User();
		instance._anonymousUser = anonymousUser;
		return instance;
	}
}
