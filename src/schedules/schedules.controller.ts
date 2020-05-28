import { Body, Controller, Delete, Get, Path, Post, Put, Route, SuccessResponse, Tags } from 'tsoa';
import { ScheduleRequest, ScheduleResponse } from "./schedules.apicontract";
import { Inject } from "typescript-ioc";
import { SchedulesService } from "./schedules.service";

@Route('api/v1/schedules')
@Tags('Schedules')
export class SchedulesController extends Controller {
	@Inject
	private scheduleService: SchedulesService;

	@Post('')
	@SuccessResponse(201, 'Created')
	public async createSchedule(@Body() timeslot: ScheduleRequest): Promise<ScheduleResponse> {
		return await this.scheduleService.createSchedule(timeslot);
	}

	@Get("")
	public async getSchedules(): Promise<ScheduleResponse[]> {
		return await this.scheduleService.getSchedules();
	}

	@Put('{id}')
	@SuccessResponse(200, 'Updated')
	public async updateSchedule(@Path() id: number, @Body() timeslot: ScheduleRequest): Promise<ScheduleResponse> {
		return await this.scheduleService.updateSchedule(id, timeslot);
	}

	@Delete('{id}')
	@SuccessResponse(200, 'Deleted')
	public async deleteSchedule(@Path() id: number): Promise<any> {
		return await this.scheduleService.deleteSchedule(id);
	}
}
