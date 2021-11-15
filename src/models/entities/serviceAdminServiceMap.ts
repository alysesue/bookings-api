import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { IService, IUser } from '../interfaces';

@Entity()
export class ServiceAdminServiceMap {
	@PrimaryColumn()
	private _adminId: number;

	public set adminId(value: number) {
		this._adminId = value;
	}

	public get adminId() {
		return this._adminId;
	}

	@OneToOne('AdminUser', { nullable: false })
	@JoinColumn({ name: '_id' })
	public _adminUser: IUser;

	@Column()
	private _serviceId: number;

	public set serviceId(value: number) {
		this._serviceId = value;
	}

	public get serviceId() {
		return this._serviceId;
	}

	@OneToOne('Service', { nullable: false })
	@JoinColumn({ name: '_serviceId' })
	public _service: IService;
}
