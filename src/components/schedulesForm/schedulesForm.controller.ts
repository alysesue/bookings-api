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
import { ScheduleFormRequest, ScheduleFormResponse } from './schedulesForm.apicontract';
import { Inject } from 'typescript-ioc';
import { SchedulesFormService } from './schedulesForm.service';
import { MOLAuth } from 'mol-lib-common';

@Route('v1/schedulesForm')
@Tags('SchedulesForm')
export class SchedulesFormController extends Controller {
	@Inject
	private scheduleFormService: SchedulesFormService;

	@Deprecated()
	@Post('')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async createScheduleForm(@Body() timeslot: ScheduleFormRequest): Promise<ScheduleFormResponse> {
		this.setStatus(201);
		return await this.scheduleFormService.createScheduleForm(timeslot);
	}

	@Deprecated()
	@Get('')
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async getSchedulesForm(): Promise<ScheduleFormResponse[]> {
		return await this.scheduleFormService.getSchedulesForm();
	}

	@Deprecated()
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

	@Deprecated()
	@Delete('{id}')
	@SuccessResponse(200, 'Deleted')
	@MOLAuth({ admin: {} })
	@Response(401, 'Valid authentication types: [admin]')
	public async deleteScheduleForm(@Path() id: number): Promise<any> {
		return await this.scheduleFormService.deleteScheduleForm(id);
	}
}
