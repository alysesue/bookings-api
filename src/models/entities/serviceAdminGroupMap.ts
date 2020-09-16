import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { IService } from '../interfaces';

@Entity()
export class ServiceAdminGroupMap {
	@PrimaryColumn()
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

	@Column({ type: 'varchar', length: 200, nullable: false })
	@Index({ unique: true })
	private _userGroupRef: string;

	public set userGroupRef(value: string) {
		this._userGroupRef = value;
	}

	public get userGroupRef() {
		return this._userGroupRef;
	}
}
