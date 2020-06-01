import { BaseEntity, Column, Entity, Generated, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Schedule } from "./schedule";

@Entity()
export class Calendar extends BaseEntity {

	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ type: "uuid" })
	@Index({ unique: true })
	@Generated("uuid")
	public uuid: string;


	@Column({ type: "varchar", length: 300 })
	public googleCalendarId: string;

	@ManyToOne("Schedule", { nullable: true })
	public schedule: Schedule;

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
