import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { IService } from '../interfaces';
import { Label } from './label';

@Entity()
@Unique('ServiceCategories', ['_categoryName', '_serviceId'])
export class Category {
	public constructor() {}

	public static create(categoryName: string, labels: Label[] = [], id?: number): Category {
		const category = new Category();
		category.categoryName = categoryName.trim();
		if (id) {
			category._id = id;
		}
		category.labels = labels;
		// if (labels && labels.length) {
		// 	category.labels = labels;
		// }
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
	private _categoryName: string;

	public get categoryName(): string {
		return this._categoryName;
	}

	public set categoryName(value: string) {
		this._categoryName = value;
	}

	@OneToMany(() => Label, (label) => label.category, { cascade: true })
	public labels: Label[];

	@ManyToOne('Service', { orphanedRowAction: 'delete' })
	@JoinColumn({ name: '_serviceId' })
	public service: IService;
	// private _service: IService;

	// public get service(): IService {
	// 	return this._service;
	// }

	// public set service(value: IService) {
	// 	this._service = value;
	// }

	@Column({ nullable: false })
	private _serviceId: number;

	public get serviceId(): number {
		return this._serviceId;
	}

	public set serviceId(value: number) {
		this._serviceId = value;
	}
}
