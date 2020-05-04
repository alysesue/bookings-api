import { Inject, Singleton } from 'typescript-ioc';
import { TimeslotsRepository } from "./timeslots.repository";
import { Timeslot } from '../../models/timeslot';

@Singleton
export class TimeslotsService {
    @Inject
    private timeslotsRepository: TimeslotsRepository;

    public async getAllAvailableTimeslots(): Promise<Timeslot[]> {

    }
}
