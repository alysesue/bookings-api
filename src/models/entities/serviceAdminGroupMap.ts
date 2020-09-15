import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IService } from '../interfaces';

@Entity()
export class ServiceAdminGroupMap {
	@PrimaryGeneratedColumn()
	private _id: number;

	public set id(id: number) {
		this._id = id;
	}

	public get id(): number {
		return this._id;
	}

	@Column({ type: 'varchar', length: 200, nullable: false })
	@Index({ unique: true })
	private _userGroupRef: string;

	public set userGroupRef(value: string) {
		this._userGroupRef = value;
	}

	public get userGroupRef() {
		return this._userGroupRef;
	}

	@Column({ nullable: false })
	@Index()
	private _serviceId: number;

	@OneToOne('Service', { nullable: false })
	@JoinColumn({ name: '_serviceId' })
	public _service: IService;
}
