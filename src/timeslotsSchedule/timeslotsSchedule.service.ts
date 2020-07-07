import { Inject, InRequestScope } from 'typescript-ioc';
import { TimeslotsScheduleRepository } from "./timeslotsSchedule.repository";
import { mapToResponse } from './timeslotsSchedule.mapper';
import { TimeslotsScheduleResponse } from './timeslotsSchedule.apicontract';

@InRequestScope
export class TimeslotsScheduleService {
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;

	public async getTimeslotsScheduleById(id: number): Promise<TimeslotsScheduleResponse> {
		return mapToResponse(await this.timeslotsScheduleRepository.getTimeslotsScheduleById(id));
	}
}
