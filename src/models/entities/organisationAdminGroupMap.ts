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

	@Column({ type: 'varchar', length: 20, nullable: false })
	@Index({ unique: true })
	private _organisationRef: string;

	public set organisationRef(value: string) {
		this._organisationRef = value;
	}

	public get organisationRef() {
		return this._organisationRef;
	}
}
