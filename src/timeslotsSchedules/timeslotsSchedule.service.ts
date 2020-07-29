import { Inject, InRequestScope } from 'typescript-ioc';
import { TimeslotsScheduleRepository } from "./timeslotsSchedule.repository";
import { TimeslotsSchedule } from '../models';
import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";

@InRequestScope
export class TimeslotsScheduleService {
	@Inject
	private timeslotsScheduleRepository: TimeslotsScheduleRepository;

	public async getTimeslotsScheduleById(id: number): Promise<TimeslotsSchedule> {
		return this.timeslotsScheduleRepository.getTimeslotsScheduleById(id);
	}

	public async createTimeslotsSchedule({id, spId}: {id?: number, spId?: number}): Promise<TimeslotsSchedule> {
		const timeslotsScheduleData = new TimeslotsSchedule();
		if (spId)
			timeslotsScheduleData._serviceProvider = spId;
		else if (id)
			timeslotsScheduleData._service = id;
		else
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Creating timeslotsSchedule... No id provide`);
		const timeslotsSchedule = await this.timeslotsScheduleRepository.createTimeslotsSchedule(timeslotsScheduleData);
		return timeslotsSchedule;
	}
}
