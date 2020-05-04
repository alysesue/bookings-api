import { Controller, Get, Post, Query, Route } from 'tsoa';
import { TimeslotModel, TimeslotsFilter } from "./timeslots.apicontract";

@Route('api/v1/timeslots')
export class TimeslotsController extends Controller {
	@Get('')
	public async getTimeslots(@Query() filter: TimeslotsFilter): Promise<TimeslotModel[]> {
		return Promise.resolve([]);
	}
}
