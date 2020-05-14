import { Body, Controller, Delete, Path, Post, Put, Route, SuccessResponse, Tags } from 'tsoa';
import { TemplateTimeslotRequest, TemplateTimeslotResponse } from "./templatesTimeslots.apicontract";
import { Inject } from "typescript-ioc";
import TemplatesTimeslotsService from "./templatesTimeslots.service";

@Route('api/v1/templatestimeslots')
@Tags('Timeslots_templates')
export class TemplatesTimeslotsController extends Controller {
	@Inject
	private timeslotsService: TemplatesTimeslotsService;

	@Post('')
	@SuccessResponse(201, 'Created')
	public async createTemplateTimeslots(@Body() timeslot: TemplateTimeslotRequest): Promise<TemplateTimeslotResponse> {
		return await this.timeslotsService.createTemplateTimeslots(timeslot);
	}

	@Put('')
	@SuccessResponse(200, 'Updated')
	public async updateTemplateTimeslots(@Body() timeslot: TemplateTimeslotRequest): Promise<TemplateTimeslotResponse> {
		return await this.timeslotsService.updateTemplateTimeslots(timeslot);
	}

	@Delete('{id}')
	@SuccessResponse(200, 'Deleted')
	public async deleteTemplateTimeslots(@Path() id: number): Promise<any> {
		return await this.timeslotsService.deleteTemplateTimeslots(id);
	}
}
