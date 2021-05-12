import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IService } from '../interfaces';
import { Category } from './category';

@Entity()
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
	public category: Category;
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
