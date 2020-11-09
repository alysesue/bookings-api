import { InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { Calendar } from '../../models/entities/calendar';

/**
 * @deprecated The class should not be used, it has been created at the start of the project to link booking with google calendar (with caldav protocole). We dont use it anymore
 */
@InRequestScope
export class CalendarsRepository extends RepositoryBase<Calendar> {
	constructor() {
		super(Calendar);
	}

	public async getCalendars(): Promise<Calendar[]> {
		return (await this.getRepository()).find();
	}

	public async getCalendarByUUID(uuid: string): Promise<Calendar> {
		return (await this.getRepository()).findOne({ uuid });
	}

	public async saveCalendar(calendar: Calendar): Promise<Calendar> {
		return (await this.getRepository()).save(calendar);
	}
}
