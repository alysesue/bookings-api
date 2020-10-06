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
import { ScheduleFormRequest, ScheduleFormResponse } from './scheduleForms.apicontract';
import { Inject } from 'typescript-ioc';
import { ScheduleFormsService } from './scheduleForms.service';
import { MOLAuth } from 'mol-lib-common';

@Route('v1/scheduleForms')
@Tags('ScheduleForms')
export class ScheduleFormsController extends Controller {
	@Inject
	private scheduleFormService: ScheduleFormsService;

	@Post('')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async createScheduleForm(@Body() timeslot: ScheduleFormRequest): Promise<ScheduleFormResponse> {
		this.setStatus(201);
		return await this.scheduleFormService.createScheduleForm(timeslot);
	}

	@Get('')
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async getScheduleForms(): Promise<ScheduleFormResponse[]> {
		return await this.scheduleFormService.getScheduleForms();
	}

	@Put('{id}')
	@SuccessResponse(200, 'Updated')
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async updateScheduleForm(
		@Path() id: number,
		@Body() timeslot: ScheduleFormRequest,
	): Promise<ScheduleFormResponse> {
		return await this.scheduleFormService.updateScheduleForm(id, timeslot);
	}

	@Delete('{id}')
	@SuccessResponse(200, 'Deleted')
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async deleteScheduleForm(@Path() id: number): Promise<any> {
		return await this.scheduleFormService.deleteScheduleForm(id);
	}
}
