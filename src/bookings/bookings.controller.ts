import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { Inject } from "typescript-ioc";

import {Body, Controller, Get, Post, Route, SuccessResponse} from "tsoa";
import {BookingResponse} from "./booking.response";
import { BookingsService } from "./bookings.service";
import { BookingRequest } from "./booking.request";
import { ErrorResponse } from "./errorResponse";
import {Booking} from "../models";

@Route("api/v1/bookings")
export class BookingsController extends Controller {
	@Inject
	private bookingsService: BookingsService;

	@Get()
	@SuccessResponse(200, 'OK')
	public async getBookings(): Promise<BookingResponse[]> {
		const bookings = await this.bookingsService.getBookings();
		return this.mapDataModels(bookings);
	}

	@Post()
	@SuccessResponse(201, 'OK')
	public async postBooking(@Body() bookingRequest: BookingRequest): Promise<any> {
		try {
			const booking = await this.bookingsService.save(bookingRequest);
			return BookingsController.mapDataModel(booking);
		} catch (err) {
			logger.error("endpointPostBooking:: error: ", err);
			this.setStatus(400);
			return new ErrorResponse(err.message);
		}
	}

	private mapDataModels(bookings: Booking[]): BookingResponse[] {
		return bookings?.map(e => BookingsController.mapDataModel(e));
	}

	private static mapDataModel(booking: Booking): BookingResponse {
		return {
			id: booking.id,
			status: booking.status,
			sessionDurationInMinutes: booking.sessionDurationInMinutes,
			startDateTime: booking.startDateTime
		} as BookingResponse;
	}
}
