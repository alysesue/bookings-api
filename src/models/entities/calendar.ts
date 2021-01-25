import { Column, Generated, Index, PrimaryGeneratedColumn } from 'typeorm';
import { basePath } from '../../config/app-config';

/**
 * @deprecated The class should not be used, it has been created at the start of the project to link booking with google calendar (with caldav protocole). We dont use it anymore
 */
export class Calendar {
	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ type: 'uuid' })
	@Index({ unique: true })
	@Generated('uuid')
	public uuid: string;

	@Column({ type: 'varchar', length: 300 })
	public googleCalendarId: string;

	public generateExternalUrl(timezone: string): string {
		return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(
			this.googleCalendarId,
		)}&ctz=${encodeURIComponent(timezone)}`;
	}

	public generateCaldavUserUrl(protocol: string, host: string): string {
		return `${protocol}://${host}${basePath}/caldav/${encodeURIComponent(this.googleCalendarId)}/user`;
	}

	public generateCaldavEventsUrl(protocol: string, host: string): string {
		return `${protocol}://${host}${basePath}/caldav/${encodeURIComponent(this.googleCalendarId)}/events`;
	}
}
