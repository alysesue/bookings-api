import { Controller, Get, Route, Tags, Path } from 'tsoa';
import { Inject } from "typescript-ioc";
import { TimeslotsScheduleService } from './timeslotsSchedule.service';
import { TimeslotsScheduleResponse } from './timeslotsSchedule.apicontract';

@Route('v1/timeslotSchedule')
@Tags('Timeslots Schedule')
export class TimeslotsScheduleController extends Controller {
	@Inject
	private timeslotsScheduleService: TimeslotsScheduleService;

	@Get("{id}")
	public async getSchedules(@Path() id: number): Promise<TimeslotsScheduleResponse> {
		return await this.timeslotsScheduleService.getTimeslotsScheduleById(id);
	}
}
