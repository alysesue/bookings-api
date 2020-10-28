import { Body, Controller, Delete, Get, Hidden, Path, Post, Put, Response, Route, SuccessResponse, Tags } from 'tsoa';
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

	/**
	 * Updates a schedule form.
	 * @param @isInt id The schedule form id.
	 * @param timeslot The schedule form request
	 */
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

	/**
	 * Deletes a schedule form.
	 * @param @isInt id The schedule form id.
	 */
	@Delete('{id}')
	@SuccessResponse(204, 'Deleted')
	@MOLAuth({ admin: {}, agency: {} })
	@Response(401, 'Valid authentication types: [admin,agency]')
	@Hidden()
	public async deleteScheduleForm(@Path() id: number): Promise<void> {
		// tslint:disable-next-line:no-commented-code
		// await this.scheduleFormService.deleteScheduleForm(id);
	}
}
