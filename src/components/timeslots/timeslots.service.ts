import { Inject, Singleton } from 'typescript-ioc';
import { TimeslotsRepository } from "./timeslots.repository";
import { Timeslot } from '../../models/timeslot';

@Singleton
export default class TimeslotsService {
	@Inject
	private timeslotsRepository: TimeslotsRepository;

	public async getAllAvailableTimeslots(): Promise<Timeslot[]> {

	}

    public async addAvailableTimeslot(calendarId, startDate: Date, endDate: Date): Promise<Timeslot[]> {
        const timeslots: Timeslot = new Timeslot(calendarId, startDate, endDate, true);
    }

}
