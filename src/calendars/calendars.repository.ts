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
		return (await this.getRepository<Calendar>()).find({relations: ['templatesTimeslots']});
	}

	public async getCalendarByUUID(uuid: string): Promise<Calendar> {
		return (await this.getRepository<Calendar>()).findOne({uuid});
	}

	public async saveCalendar(calendar: Calendar): Promise<Calendar> {
		return (await this.getRepository<Calendar>()).save(calendar);
	}

	public async searchCalendar(from, to): Promise<Calendar[]> {
		// TODO : search against timeslot
		return (await this.getRepository<Calendar>()).find();
	}
}
