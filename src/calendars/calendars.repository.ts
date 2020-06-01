import { Inject, Singleton } from 'typescript-ioc';
import { Calendar, Schedule } from '../models';
import { RepositoryBase } from "../core/repository";
import { SchedulesRepository } from '../schedules/schedules.repository';
import { groupByKeyLastValue } from '../tools/collections';

@Singleton
export class CalendarsRepository extends RepositoryBase<Calendar> {
	@Inject
	private scheduleRepository: SchedulesRepository;

	constructor() {
		super(Calendar);

	}

	public async getCalendars(): Promise<Calendar[]> {
		return (await this.getRepository()).find();
	}

	private async populateSchedules(calendars: Calendar[]): Promise<Calendar[]> {
		const scheduleIds = calendars.map(e => e.getScheduleId()).filter(id => !!id);
		const schedulesById = groupByKeyLastValue(await this.scheduleRepository.getSchedules(scheduleIds), s => s.id);

		for (const calendar of calendars.filter(c => !!c.getScheduleId())) {
			const schedule = schedulesById.get(calendar.getScheduleId());
			calendar.schedule = schedule;
		}
		return calendars;
	}

	public async getCalendarsWithTemplates(): Promise<Calendar[]> {
		const calendars = (await this.getCalendars());
		return this.populateSchedules(calendars);
	}

	public async getCalendarByUUID(uuid: string): Promise<Calendar> {
		return (await this.getRepository()).findOne({uuid});
	}

	public async saveCalendar(calendar: Calendar): Promise<Calendar> {
		return (await this.getRepository()).save(calendar);
	}
}
