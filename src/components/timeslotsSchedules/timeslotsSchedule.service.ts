import { Inject, InRequestScope } from 'typescript-ioc';
import { TimeslotsSchedule } from '../../models';
import { TimeslotsScheduleRepository } from './timeslotsSchedule.repository';

@InRequestScope
export class TimeslotsScheduleService {
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;

	public async getTimeslotsScheduleById(id: number): Promise<TimeslotsSchedule> {
		return this.timeslotsScheduleRepository.getTimeslotsScheduleById({ id });
	}
}
