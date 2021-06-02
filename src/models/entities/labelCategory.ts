import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IService } from '../interfaces';
import { Label } from './label';

@Entity()
@Index('ServiceCategories', ['_name', '_serviceId'], { unique: true })
export class LabelCategory {
	public constructor() {}

	public static create(name: string, labels: Label[] = [], id?: number): LabelCategory {
		const category = new LabelCategory();
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

	@OneToMany(() => Label, (label) => label.category, { cascade: true })
	public labels: Label[];

	@ManyToOne('Service', { orphanedRowAction: 'delete' })
	@JoinColumn({ name: '_serviceId' })
	public service: IService;

	@Column({ nullable: false })
	private _serviceId: number;

	public get serviceId(): number {
		return this._serviceId;
	}

	public set serviceId(value: number) {
		this._serviceId = value;
	}
}
