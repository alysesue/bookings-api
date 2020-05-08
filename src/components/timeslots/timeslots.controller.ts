import { Body, Controller, Post, Route } from 'tsoa';
import { TimeslotParams } from "./timeslots.apicontract";
import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { Inject } from "typescript-ioc";
import TimeslotsService from "./timeslots.service";

@Route('api/v1/timeslots')
export class TimeslotsController extends Controller {
	@Inject
	private timeslotsService : TimeslotsService;

	// @Get('/list')
	// public async getTimeslots(@Query() filter: TimeslotsFilter): Promise<TimeslotModel[]> {
	// 	return Promise.resolve([]);
	// }

	@Post('/add')
	public async addTemplateTimeslots(@Body() timeslot: TimeslotParams): Promise<boolean> {
		try {
			await this.timeslotsService.addTemplateTimeslots(timeslot);
			return true;
		} catch (err) {
			logger.error('endpointGetUsers:: error: ', err);
			throw err;
		}

	}
}
