import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ServiceProvider extends BaseEntity {

	constructor(name: string) {
		super();
		this._name = name;
		this._createdAt = new Date();
	}

	@PrimaryGeneratedColumn()
	private _id: number;

	public get id(): number {
		return this._id;
	}

	@Column({ type: "varchar", length: 300 })
	private _name: string;

	public get name(): string {
		return this._name;
	}

	public set name(value: string) {
		this._name = value;
	}

	@Column()
	private _createdAt: Date;
}
