import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Organisation } from './organisation';
import { IUser } from '../interfaces';
import { Service } from './service';

@Entity()
export class AdminUser {
	constructor() {}

	@PrimaryGeneratedColumn()
	private _id: number;

	@OneToOne('User', { nullable: false })
	@JoinColumn({ name: '_userId' })
	public _User: IUser;

	@Column({ type: 'uuid', nullable: false })
	@Index({ unique: true })
	private _molAdminId: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	private _agencyUserId: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	private _userName: string;

	@Column({ type: 'varchar', length: 100, nullable: false })
	private _email: string;

	@Column({ type: 'varchar', length: 100, nullable: true })
	private _name: string;

	public get id(): number {
		return this._id;
	}

	public set id(value: number) {
		this._id = value;
	}

	public get molAdminId() {
		return this._molAdminId;
	}

	public set molAdminId(molAdminId: string) {
		this._molAdminId = molAdminId;
	}

	public get agencyUserId() {
		return this._agencyUserId;
	}

	public set agencyUserId(value: string) {
		this._agencyUserId = value;
	}

	public get userName(): string {
		return this._userName;
	}

	public set userName(value: string) {
		this._userName = value;
	}

	public get email(): string {
		return this._email;
	}

	public set email(value: string) {
		this._email = value;
	}

	public get name(): string {
		return this._name;
	}

	public set name(value: string) {
		this._name = value;
	}

	public static create({
		molAdminId,
		userName,
		email,
		name,
		agencyUserId,
	}: {
		molAdminId: string;
		userName: string;
		email: string;
		name: string;
		agencyUserId?: string;
	}) {
		const instance = new AdminUser();
		instance.molAdminId = molAdminId;
		instance.userName = userName;
		instance.email = email;
		instance.name = name;
		instance.agencyUserId = agencyUserId;
		return instance;
	}

	@ManyToMany('Service', '_adminUsers')
	@JoinTable({
		name: 'service_admin_service_map',
		joinColumn: { name: 'adminUser_id' },
		inverseJoinColumn: { name: 'service_id' },
	})
	private _services: Service[];

	public get services(): Service[] {
		return this._services;
	}

	public set services(value: Service[]) {
		this._services = value;
	}

	@ManyToMany('Organisation', '_adminUsers')
	@JoinTable({
		name: 'organisation_admin_organisation_map',
		joinColumn: { name: 'adminUser_id' },
		inverseJoinColumn: { name: 'organisation_id' },
	})
	private _organisations: Organisation[];

	public get organisations(): Organisation[] {
		return this._organisations;
	}

	public set organisations(value: Organisation[]) {
		this._organisations = value;
	}
}
