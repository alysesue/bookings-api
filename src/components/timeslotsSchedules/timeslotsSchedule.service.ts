import { Inject, InRequestScope } from 'typescript-ioc';
import { TimeslotsScheduleRepository, TimeslotsScheduleSearchOptions } from './timeslotsSchedule.repository';
import { TimeslotsSchedule } from '../../models';

@InRequestScope
export class TimeslotsScheduleService {
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;

	public async getTimeslotsScheduleById(id: number, options: TimeslotsScheduleSearchOptions): Promise<TimeslotsSchedule> {
		return this.timeslotsScheduleRepository.getTimeslotsScheduleById(id, options);
	}
}
