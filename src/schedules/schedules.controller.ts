import { Body, Controller, Delete, Path, Post, Put, Route, SuccessResponse, Tags } from 'tsoa';
import { ScheduleRequest, ScheduleResponse } from "./schedules.apicontract";
import { Inject } from "typescript-ioc";
import SchedulesService from "./schedules.service";

@Route('api/v1/schedules')
@Tags('Schedules')
export class SchedulesController extends Controller {
	@Inject
	private timeslotsService: SchedulesService;

	@Post('')
	@SuccessResponse(201, 'Created')
	public async createSchedule(@Body() timeslot: ScheduleRequest): Promise<ScheduleResponse> {
		return await this.timeslotsService.createSchedule(timeslot);
	}

	@Put('')
	@SuccessResponse(200, 'Updated')
	public async updateSchedule(@Body() timeslot: ScheduleRequest): Promise<ScheduleResponse> {
		return await this.timeslotsService.updateSchedule(timeslot);
	}

	@Delete('{id}')
	@SuccessResponse(200, 'Deleted')
	public async deleteSchedule(@Path() id: number): Promise<any> {
		return await this.timeslotsService.deleteSchedule(id);
	}
}
