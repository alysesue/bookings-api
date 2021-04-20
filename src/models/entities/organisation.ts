import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import * as _ from 'lodash';
import { IOrganisation } from '../interfaces';
import { OrganisationAdminGroupMap } from './organisationAdminGroupMap';

@Entity()
export class Organisation implements IOrganisation {
	constructor() {
		this._configuration = { schemaVersion: 1 };
	}

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

	@Column({ type: 'jsonb', nullable: false, default: '{}' })
	private _configuration: OrgConfigurationJsonVersion & OrgConfigurationJsonSchema;

	public get configuration(): OrgConfigurationJsonSchema {
		return this._configuration;
	}

	public set configuration(value: OrgConfigurationJsonSchema) {
		const clone = _.cloneDeep(value) as OrgConfigurationJsonVersion & OrgConfigurationJsonSchema;
		clone.schemaVersion = 1;
		this._configuration = clone;
	}
}

type OrgConfigurationJsonVersion = {
	schemaVersion?: number;
};

export type AuthGroupConfigurationJsonSchema = {
	ViewPlainUinFin: boolean;
};

export type OrgConfigurationJsonSchema = {
	AuthGroups?: {
		OrganisationAdmin?: AuthGroupConfigurationJsonSchema;
		ServiceAdmin?: AuthGroupConfigurationJsonSchema;
		ServiceProvider?: AuthGroupConfigurationJsonSchema;
	};
};
