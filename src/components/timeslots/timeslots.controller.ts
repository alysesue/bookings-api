import {Controller, Get, Post, Query, Route} from 'tsoa';
import {TimeslotModel, TimeslotsFilter} from "./timeslots.apicontract";
import {logger} from "mol-lib-common/debugging/logging/LoggerV2";
import {Inject} from "typescript-ioc";

@Route('api/v1/timeslots')
export class TimeslotsController extends Controller {
	public timeslotsService;
	@Inject
	private TimeslotsService;

	@Get('')
	public async getTimeslots(@Query() filter: TimeslotsFilter): Promise<TimeslotModel[]> {
		return Promise.resolve([]);
	}

	@Post('')
	public async addAvailableTimeslot(@Body() startDate: Date, @Body() endDate: Date): {
		try {
			const booking = await this.bookingsService.getBookings();
			timeslotsService.addAvailableTimeslot(2314, startDate, endDate);
			return new BookingsResponse(users);
		}
		catch(err) {
			logger.error('endpointGetUsers:: error: ', err);
			throw err;
		}

}
}
