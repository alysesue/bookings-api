import { Column, Entity, Index, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IOrganisation } from '../interfaces';
import { OrganisationAdminGroupMap } from './organisationAdminGroupMap';

@Entity()
export class Organisation implements IOrganisation {
	@PrimaryGeneratedColumn()
	private _id: number;

	public set id(id: number) {
		this._id = id;
	}

	public get id(): number {
		return this._id;
	}

	@OneToOne((type) => OrganisationAdminGroupMap, (e) => e._organisation, { nullable: true, cascade: true })
	public _organisationAdminGroupMap: OrganisationAdminGroupMap;

	@Column({ type: 'varchar', length: 100, nullable: false })
	private _name: string;

	public set name(name: string) {
		this._name = name;
	}

	public get name() {
		return this._name;
	}
}
