import { Column, Entity, Generated, Index, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TemplateTimeslots } from "./index";
import { ICalendar } from "./calendar.interface";
import { ITemplateTimeslots } from "./templateTimeslots.interface";

@Entity()
export class Calendar implements ICalendar{

	@PrimaryGeneratedColumn()
	public id: number;

	@Column({type: "uuid"})
	@Index({unique: true})
	@Generated("uuid")
	public uuid: string;


	@Column({type: "varchar", length: 300})
	public googleCalendarId: string;

	@ManyToMany("TemplateTimeslots", "calendars")
	public templateTimeslots: ITemplateTimeslots[];

	constructor() {
	}

	public generateExternalUrl(timezone: string): string {
		return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(this.googleCalendarId)}&ctz=${encodeURIComponent(timezone)}`;
	}
}
