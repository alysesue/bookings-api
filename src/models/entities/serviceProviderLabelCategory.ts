import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IOrganisation } from '../interfaces';
import { ServiceProviderLabel } from './serviceProviderLabel';

@Entity()
@Index('ServiceProviderCategories', ['_name', '_organisationId'], { unique: true })
export class ServiceProviderLabelCategory {
	public constructor() {}

	public static create(name: string, labels: ServiceProviderLabel[] = [], id?: number): ServiceProviderLabelCategory {
		const category = new ServiceProviderLabelCategory();
		category.name = name.trim();
		if (id) {
			category._id = id;
		}
		category.labels = labels;
		return category;
	}

	@PrimaryGeneratedColumn()
	private _id: number;

	public get id(): number {
		return this._id;
	}

	public set id(value: number) {
		this._id = value;
	}

	@Column({ type: 'varchar', length: 500, nullable: false })
	private _name: string;

	public get name(): string {
		return this._name;
	}

	public set name(value: string) {
		this._name = value;
	}

	@OneToMany(() => ServiceProviderLabel, (label) => label.category, { cascade: true })
	public labels: ServiceProviderLabel[];

	@ManyToOne('Organisation', { orphanedRowAction: 'delete' })
	@JoinColumn({ name: '_organisationId' })
	public organisation: IOrganisation;

	@Column({ nullable: false })
	private _organisationId: number;

	public get organisationId(): number {
		return this._organisationId;
	}

	public set organisationId(value: number) {
		this._organisationId = value;
	}
}
