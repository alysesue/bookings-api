import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LabelRequestModel } from '../../components/labels/label.apicontract';
import { IService, ITimeslotItem } from '../interfaces';
import { LabelRequestModel } from "../../components/labels/label.apicontract";

@Entity()
export class Label {
	public constructor() {}

	public static create(labelText: string): Label {
		const label = new Label();
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

	@ManyToOne('Service')
	@JoinColumn({ name: '_serviceId' })
	public service: IService;

	@ManyToOne('OneOffTimeslot')
	@JoinColumn({ name: '_oneOffTimeslotId' })
	private _oneOffTimeslot: ITimeslotItem;

	public get oneOffTimeslot(): ITimeslotItem {
		return this._oneOffTimeslot;
	}

	public set oneOffTimeslot(value: ITimeslotItem) {
		this._oneOffTimeslot = value;
	}

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
