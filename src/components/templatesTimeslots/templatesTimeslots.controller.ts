import { Body, Controller, Delete, Path, Post, Route, Tags } from 'tsoa';
import {TemplateTimeslotRequest, TemplateTimeslotResponse} from "./templatesTimeslots.apicontract";
import { Inject } from "typescript-ioc";
import TemplatesTimeslotsService from "./templatesTimeslots.service";

@Route('api/v1/timeslottemplates')
@Tags('Timeslots_templates')
export class TemplatesTimeslotsController extends Controller {
	@Inject
	private timeslotsService: TemplatesTimeslotsService;

	@Post('')
	public async createTemplateTimeslots(@Body() timeslot: TemplateTimeslotRequest): Promise<TemplateTimeslotResponse> {
		return await this.timeslotsService.createTemplateTimeslots(timeslot);
	}

	@Post('')
	public async updateTemplateTimeslots(@Body() timeslot: TemplateTimeslotRequest): Promise<TemplateTimeslotResponse> {
		return await this.timeslotsService.updateTemplateTimeslots(timeslot);
	}

	@Delete('{id}')
	public async deleteTemplateTimeslots(@Path() id: number): Promise<any> {
		return await this.timeslotsService.deleteTemplateTimeslots(id);
	}
}
