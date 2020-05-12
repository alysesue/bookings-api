import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Weekday } from "../enums/weekday";
import { Calendar } from "./index";
import { ITemplateTimeslots } from "./templateTimeslots.interface";
import { ICalendar } from "./calendar.interface";

@Entity()
export class TemplateTimeslots implements ITemplateTimeslots{

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

	@ManyToMany("Calendar", "templateTimeslots")
	@JoinTable()
	public calendars: ICalendar[];

	constructor(name: string, firstSlotStartTime: Date, lastSlotEndTime: Date, slotsDuration: number, weekdays: Weekday[], calendars: Calendar[]) {
		this.name = name;
		this.firstSlotStartTime = firstSlotStartTime;
		this.lastSlotEndTime = lastSlotEndTime;
		this.slotsDuration = slotsDuration;
		this.weekdays = weekdays;
		this.calendars = calendars;
	}
}
