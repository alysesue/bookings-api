import {
	Body,
	Controller,
	Delete,
	Deprecated,
	Get,
	Path,
	Post,
	Put,
	Response,
	Route,
	SuccessResponse,
	Tags,
} from 'tsoa';
import { ScheduleRequest, ScheduleResponse } from './schedules.apicontract';
import { Inject } from 'typescript-ioc';
import { SchedulesService } from './schedules.service';
import { MOLAuth } from 'mol-lib-common';

@Route('v1/schedules')
@Tags('Schedules')
export class SchedulesController extends Controller {
	@Inject
	private scheduleService: SchedulesService;

	@Deprecated()
	@Post('')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async createSchedule(@Body() timeslot: ScheduleRequest): Promise<ScheduleResponse> {
		this.setStatus(201);
		return await this.scheduleService.createSchedule(timeslot);
	}

	@Deprecated()
	@Get('')
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async getSchedules(): Promise<ScheduleResponse[]> {
		return await this.scheduleService.getSchedules();
	}

	@Deprecated()
	@Put('{id}')
	@SuccessResponse(200, 'Updated')
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async updateSchedule(@Path() id: number, @Body() timeslot: ScheduleRequest): Promise<ScheduleResponse> {
		return await this.scheduleService.updateSchedule(id, timeslot);
	}

	@Deprecated()
	@Delete('{id}')
	@SuccessResponse(200, 'Deleted')
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async deleteSchedule(@Path() id: number): Promise<any> {
		return await this.scheduleService.deleteSchedule(id);
	}
}
