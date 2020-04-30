import { Inject, Singleton } from 'typescript-ioc';
import { Calendar } from '../models/calendar';
import { CalendarsRepository } from './calendars.repository';

@Singleton
export class CalendarsService {

	@Inject
	private calendarsRepository: CalendarsRepository;

	public async getCalendars(): Promise<Calendar[]> {
		return await this.calendarsRepository.getCalendars();
	}

	public async createCalendar(): Promise<Calendar> {
		var calendar = new Calendar();

		return await this.calendarsRepository.saveCalendar(calendar);
	}
}
