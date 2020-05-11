import { Body, Controller, Post, Route } from 'tsoa';
import { TimeslotParams } from "./templatesTimeslots.apicontract";
import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { Inject } from "typescript-ioc";
import TemplatesTimeslotsService from "./templatesTimeslots.service";
import { TemplateTimeslots } from "../../models/templateTimeslots";

@Route('api/v1/timeslots')
export class TemplatesTimeslotsController extends Controller {
	@Inject
	private timeslotsService: TemplatesTimeslotsService;

	// @Get('/list')
	// public async getTimeslots(@Query() filter: TimeslotsFilter): Promise<TimeslotModel[]> {
	// 	return Promise.resolve([]);
	// }

	@Post('/upsert')
	public async upsertTemplateTimeslots(@Body() timeslot: TimeslotParams): Promise<TemplateTimeslots> {
		try {
			return await this.timeslotsService.upsertTemplateTimeslots(timeslot);
		} catch (err) {
			logger.error('endpointGetUsers:: error: ', err);
			throw err;
		}

	}

	@Post('/delete')
	public async deleteTemplateTimeslots(@Body() timeslot: TimeslotParams): Promise<TemplateTimeslots> {
		try {
			return await this.timeslotsService.deleteTemplateTimeslots(timeslot);
		} catch (err) {
			logger.error('endpointGetUsers:: error: ', err);
			throw err;
		}

	}
}
