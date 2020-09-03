import { InRequestScope } from 'typescript-ioc';
import { Calendar } from '../../models';
import { RepositoryBase } from '../../core/repository';

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
