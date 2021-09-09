import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import * as _ from 'lodash';
import { IOrganisation } from '../interfaces';
import { OrganisationAdminGroupMap } from './organisationAdminGroupMap';
import { ServiceProviderLabel } from './serviceProviderLabel';
import { ServiceProviderLabelCategory } from './serviceProviderLabelCategory';

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

	@OneToOne(() => OrganisationAdminGroupMap, (e) => e._organisation, { nullable: true, cascade: true })
	public _organisationAdminGroupMap: OrganisationAdminGroupMap;

	@Column({ type: 'varchar', length: 100, nullable: false })
	private _name: string;

	public set name(name: string) {
		this._name = name;
	}

	public get name() {
		return this._name;
	}

	public static create(name: string, id?: number): Organisation {
		const instance = new Organisation();
		instance._name = name;
		instance._id = id;

		return instance;
	}

	@OneToMany(() => ServiceProviderLabel, (label) => label.organisation, { cascade: true })
	public labels: ServiceProviderLabel[];

	@OneToMany(() => ServiceProviderLabelCategory, (category) => category.organisation, { cascade: true })
	public categories: ServiceProviderLabelCategory[];

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
