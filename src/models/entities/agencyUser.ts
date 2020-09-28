import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IUser } from '../interfaces';

@Entity()
export class AgencyUser {
	constructor() {}

	@PrimaryGeneratedColumn()
	private _id: number;

	@OneToOne('User', { nullable: false })
	@JoinColumn({ name: '_userId' })
	public _User: IUser;

	@Column({ type: 'varchar', length: 100, nullable: false })
	@Index({ unique: true })
	private _agencyAppId: string;

	@Column({ type: 'varchar', length: 100, nullable: false })
	private _agencyName: string;

	public get id(): number {
		return this._id;
	}

	public set id(value: number) {
		this._id = value;
	}

	public get agencyAppId() {
		return this._agencyAppId;
	}

	public set agencyAppId(value: string) {
		this._agencyAppId = value;
	}

	public get agencyName() {
		return this._agencyName;
	}

	public set agencyName(value: string) {
		this._agencyName = value;
	}

	public static create({ agencyAppId, agencyName }: { agencyAppId: string; agencyName: string }) {
		const instance = new AgencyUser();
		instance.agencyAppId = agencyAppId;
		instance.agencyName = agencyName;
		return instance;
	}
}
