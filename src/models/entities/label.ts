import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ILabelCategory, IService } from '../interfaces';

@Entity()
@Index('LabelsCategoriesService', ['_labelText', '_serviceId', '_categoryId'], { unique: true })
export class Label {
	public constructor() {}

	public static create(labelText: string, id?: number): Label {
		const label = new Label();
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

	@ManyToOne('Service', { orphanedRowAction: 'delete' })
	@JoinColumn({ name: '_serviceId' })
	public service: IService;

	@ManyToOne('LabelCategory', { orphanedRowAction: 'delete' })
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
	private _serviceId: number;

	public get serviceId(): number {
		return this._serviceId;
	}

	public set serviceId(value: number) {
		this._serviceId = value;
	}
}
