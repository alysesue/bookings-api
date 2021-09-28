import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ILabelCategory, IOrganisation } from '../interfaces';

@Entity()
@Index('ServiceProviderLabel', ['_labelText', '_organisationId', '_categoryId'], { unique: true })
export class ServiceProviderLabel {
	public constructor() {}

	public static create(labelText: string, id?: number): ServiceProviderLabel {
		const label = new ServiceProviderLabel();
		if (id) {
			label._id = id;
		}
		label.labelText = labelText;
		return label;
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
	private _labelText: string;

	public get labelText(): string {
		return this._labelText;
	}

	public set labelText(value: string) {
		this._labelText = value;
	}

	@ManyToOne('Organisation', { orphanedRowAction: 'delete' })
	@JoinColumn({ name: '_organisationId' })
	public organisation: IOrganisation;

	@ManyToOne('ServiceProviderLabelCategory', { orphanedRowAction: 'delete' })
	@JoinColumn({ name: '_categoryId' })
	public category: ILabelCategory;

	@Column({ nullable: true })
	private _categoryId: number;
	public get categoryId(): number {
		return this._categoryId;
	}

	public set categoryId(value: number) {
		this._categoryId = value;
	}

	@Column({ nullable: true })
	private _organisationId: number;

	public get organisationId(): number {
		return this._organisationId;
	}

	public set organisationId(value: number) {
		this._organisationId = value;
	}
}
