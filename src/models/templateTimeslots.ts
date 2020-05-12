import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Weekday } from "../enums/weekday";
import { Calendar } from "./calendar";

@Entity()
export class TemplateTimeslots {

	@PrimaryGeneratedColumn()
	public id: number;

	@Column({type: "text"})
	public name: string;

	@Column({type: "timestamp"})
	public firstSlotStartTime: Date;

	@Column({type: "timestamp"})
	public lastSlotEndTime: Date;

	@Column({type: "int"})
	public slotsDuration: number;

	@Column("int", { array: true })
	public weekdays: Weekday[];

	@ManyToMany(type => Calendar)
	@JoinTable()
	public calendars: Calendar[];

	constructor(name: string, firstSlotStartTime: Date, lastSlotEndTime: Date, slotsDuration: number, weekdays: Weekday[], calendars: Calendar[]) {
		this.name = name;
		this.firstSlotStartTime = firstSlotStartTime;
		this.lastSlotEndTime = lastSlotEndTime;
		this.slotsDuration = slotsDuration;
		this.weekdays = weekdays;
		this.calendars = calendars;
	}
}
