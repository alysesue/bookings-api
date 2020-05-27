import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, OneToOne } from "typeorm";
import { Calendar } from "./calendar";

@Entity()
export class ServiceProvider extends BaseEntity {

	@Column()
	private _createdAt: Date;

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

	@OneToOne("Calendars", { nullable: false })
	private _calendar: Calendar;

	public get calendar(): Calendar {
		return this._calendar;
	}

	public set calendar(value: Calendar) {
		this._calendar = value;
	}
}
