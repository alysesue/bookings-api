import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IService } from '../interfaces';
import { LabelRequestModel } from '../../components/labels/label.apicontract';

@Entity()
export class Label {
	public constructor() {}

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

	@ManyToOne('Service')
	@JoinColumn({ name: '_serviceId' })
	public service: IService;

	public static creates(values: LabelRequestModel[]): Label[] {
		const data: Label[] = [];

		if (!values || values.length === 0) {
			return [];
		}

		values.forEach((value) => {
			const entity = new Label();
			if (value.id) {
				entity._id = value.id;
			}
			entity._labelText = value.label;
			data.push(entity);
		});

		return data;
	}
}
