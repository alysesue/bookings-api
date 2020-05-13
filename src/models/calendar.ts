import { Column, Entity, Generated, Index, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ICalendar } from "./calendar.interface";

@Entity()
export class Calendar implements ICalendar {

	@PrimaryGeneratedColumn()
	public id: number;

	@Column({type: "uuid"})
	@Index({unique: true})
	@Generated("uuid")
	public uuid: string;


	@Column({type: "varchar", length: 300})
	public googleCalendarId: string;

	@Column({type: "varchar", length: 100})
	public serviceProviderName: string;

	constructor() {
	}

	public generateExternalUrl(timezone: string): string {
		return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(this.googleCalendarId)}&ctz=${encodeURIComponent(timezone)}`;
	}

	public generateCaldavUserUrl(protocol: string, host: string): string {
		return `${protocol}://${host}/caldav/${encodeURIComponent(this.googleCalendarId)}/user`;
	}

	public generateCaldavEventsUrl(protocol: string, host: string): string {
		return `${protocol}://${host}/caldav/${encodeURIComponent(this.googleCalendarId)}/events`;
	}
}
