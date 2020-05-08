import { Column, Entity, Generated, Index, PrimaryGeneratedColumn } from 'typeorm';

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

	@Column({ type: "varchar", length: 100 })
	public serviceProviderName: string;

	public generateExternalUrl(timezone: string): string {
		return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(this.googleCalendarId)}&ctz=${encodeURIComponent(timezone)}`;
	}

	constructor() {
	}
}
