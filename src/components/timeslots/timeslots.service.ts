import { Inject, Singleton } from 'typescript-ioc';
import TimeslotsRepository from "./timeslots.repository";
import { Timeslot } from '../../models/timeslot';
import { TimeslotParams } from "./timeslots.apicontract";

@Singleton
export default class TimeslotsService {
	@Inject
	private timeslotsRepository: TimeslotsRepository;

	public async getAllAvailableTimeslots(): Promise<Timeslot[]> {
		return Promise.resolve([]);
	}

	public async addTemplateTimeslots(timeslot: TimeslotParams): Promise<Timeslot> {
		const {name, firstSlotStartTime, lastSlotEndTime, slotsDuration} = timeslot;
		const timeslots: Timeslot = new Timeslot(name, firstSlotStartTime, lastSlotEndTime, slotsDuration);
		return await this.timeslotsRepository.addTemplateTimeslots(timeslots);
		// return Promise.resolve(undefined);
	}

}
