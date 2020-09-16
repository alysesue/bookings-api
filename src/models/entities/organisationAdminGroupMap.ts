import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { IOrganisation } from '../interfaces';

@Entity()
export class OrganisationAdminGroupMap {
	@PrimaryColumn()
	private _organisationId: number;

	public set organisationId(value: number) {
		this._organisationId = value;
	}

	public get organisationId() {
		return this._organisationId;
	}

	@OneToOne('Organisation', { nullable: false })
	@JoinColumn({ name: '_organisationId' })
	public _organisation: IOrganisation;

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
