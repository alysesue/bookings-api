import { logger } from 'mol-lib-common/debugging/logging/LoggerV2';
import { Inject } from 'typescript-ioc';

import { Controller, Get, Route } from 'tsoa';
import { BookingsResponse } from './bookings.response';
import { BookingsService } from './bookings.service';

@Route('api')
export class BookingsController extends Controller {

	@Inject
	private bookingsService: BookingsService;

	@Get('v1/bookings')
	public async getBookings() {
		try {
			const users = await this.bookingsService.getBookings();
			return new BookingsResponse(users);
		} catch (err) {
			logger.error('endpointGetUsers:: error: ', err);
			throw err;
		}
	}
}
