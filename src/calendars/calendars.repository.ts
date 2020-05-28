import { Singleton } from 'typescript-ioc';
import { Calendar } from '../models';
import { RepositoryBase } from "../core/repository";


@Singleton
export class CalendarsRepository extends RepositoryBase {

	constructor() {
		super(Calendar);

	}

	public async getCalendars(): Promise<Calendar[]> {
		return (await this.getRepository<Calendar>()).find();
	}

	public async getCalendarsWithTemplates(): Promise<Calendar[]> {
		return (await this.getRepository<Calendar>()).find({relations: ['schedules']});
	}

	public async getCalendarByUUID(uuid: string): Promise<Calendar> {
		return (await this.getRepository<Calendar>()).findOne({uuid});
	}

	public async saveCalendar(calendar: Calendar): Promise<Calendar> {
		return (await this.getRepository<Calendar>()).save(calendar);
	}


}
