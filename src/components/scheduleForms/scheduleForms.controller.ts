import { Body, Controller, Delete, Get, Path, Post, Put, Response, Route, SuccessResponse, Tags } from 'tsoa';
import { ScheduleFormRequest, ScheduleFormResponse } from './scheduleForms.apicontract';
import { Inject } from 'typescript-ioc';
import { ScheduleFormsService } from './scheduleForms.service';
import { MOLAuth } from 'mol-lib-common';
import { ApiData, ApiDataFactory } from '../../apicontract';

@Route('v1/scheduleForms')
@Tags('ScheduleForms')
export class ScheduleFormsController extends Controller {
	@Inject
	private scheduleFormService: ScheduleFormsService;

	@Post('')
	@SuccessResponse(201, 'Created')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async createScheduleForm(@Body() timeslot: ScheduleFormRequest): Promise<ApiData<ScheduleFormResponse>> {
		this.setStatus(201);
		return ApiDataFactory.create(await this.scheduleFormService.createScheduleForm(timeslot));
	}

	@Get('')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async getScheduleForms(): Promise<ApiData<ScheduleFormResponse[]>> {
		return ApiDataFactory.create(await this.scheduleFormService.getScheduleForms());
	}

	@Put('{id}')
	@SuccessResponse(200, 'Updated')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async updateScheduleForm(
		@Path() id: number,
		@Body() timeslot: ScheduleFormRequest,
	): Promise<ApiData<ScheduleFormResponse>> {
		return ApiDataFactory.create(await this.scheduleFormService.updateScheduleForm(id, timeslot));
	}

	@Delete('{id}')
	@SuccessResponse(204, 'Deleted')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	public async deleteScheduleForm(@Path() id: number): Promise<void> {
		await this.scheduleFormService.deleteScheduleForm(id);
	}
}
