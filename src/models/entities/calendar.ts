import { BaseEntity, Column, Entity, Generated, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Schedule } from "./schedule";
import { basePath } from '../../config/app-config';

@Entity()
export class Calendar {

	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ type: "uuid" })
	@Index({ unique: true })
	@Generated("uuid")
	public uuid: string;

	@Column({ type: "varchar", length: 300 })
	public googleCalendarId: string;

	public generateExternalUrl(timezone: string): string {
		return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(this.googleCalendarId)}&ctz=${encodeURIComponent(timezone)}`;
	}

	public generateCaldavUserUrl(protocol: string, host: string): string {
		return `${protocol}://${host}${basePath}/caldav/${encodeURIComponent(this.googleCalendarId)}/user`;
	}

	public generateCaldavEventsUrl(protocol: string, host: string): string {
		return `${protocol}://${host}${basePath}/caldav/${encodeURIComponent(this.googleCalendarId)}/events`;
	}
}