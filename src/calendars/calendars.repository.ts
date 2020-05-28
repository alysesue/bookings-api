import { Singleton } from 'typescript-ioc';
import { Calendar } from '../models';
import { RepositoryBase } from "../core/repository";


@Singleton
export class CalendarsRepository extends RepositoryBase<Calendar> {

	constructor() {
		super(Calendar);

	}

	public async getCalendars(): Promise<Calendar[]> {
		return (await this.getRepository()).find();
	}

	public async getCalendarsWithTemplates(): Promise<Calendar[]> {
		return (await this.getRepository()).find({relations: ['templatesTimeslots']});
	}

	public async getCalendarByUUID(uuid: string): Promise<Calendar> {
		return (await this.getRepository()).findOne({uuid});
	}

	public async saveCalendar(calendar: Calendar): Promise<Calendar> {
		return (await this.getRepository()).save(calendar);
	}

	// todo: Not used?
	public async searchCalendar(from, to): Promise<Calendar[]> {
		// TODO : search against timeslot
		return (await this.getRepository()).find();
	}
}
