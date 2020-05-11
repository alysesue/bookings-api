import { Body, Controller, Delete, Path, Post, Route } from 'tsoa';
import { TimeslotParams } from "./templatesTimeslots.apicontract";
import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { Inject } from "typescript-ioc";
import TemplatesTimeslotsService from "./templatesTimeslots.service";
import { TemplateTimeslots } from "../../models/templateTimeslots";

@Route('api/v1/timeslottemplates')
export class TemplatesTimeslotsController extends Controller {
	@Inject
	private timeslotsService: TemplatesTimeslotsService;

	// @Get('')
	// public async getTimeslots(@Query() filter: TimeslotsFilter): Promise<TimeslotModel[]> {
	// 	return Promise.resolve([]);
	// }

	@Post('')
	public async upsertTemplateTimeslots(@Body() timeslot: TimeslotParams): Promise<TemplateTimeslots> {
		try {
			return await this.timeslotsService.upsertTemplateTimeslots(timeslot);
		} catch (err) {
			logger.error('endpointGetUsers:: error: ', err);
			throw err;
		}

	}

	@Delete('{id}')
	public async deleteTemplateTimeslots(@Path() id: number): Promise<void> {
		try {
			return await this.timeslotsService.deleteTemplateTimeslots(id);
		} catch (err) {
			logger.error('endpointGetUsers:: error: ', err);
			throw err;
		}

	}
}
