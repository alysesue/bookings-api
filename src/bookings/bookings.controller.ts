import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { Inject } from "typescript-ioc";

import { Body, Controller, Get, Path, Post, Route, SuccessResponse, Tags } from "tsoa";
import { Booking } from "../models";
import { BookingAcceptRequest, BookingRequest, BookingResponse } from "./bookings.apicontract";
import { BookingsService } from "./bookings.service";
import { ErrorResponse } from "../apicontract";

@Route("api/v1/bookings")
@Tags('Bookings')
export class BookingsController extends Controller {
	@Inject
	private bookingsService: BookingsService;

	private static mapDataModel(booking: Booking): BookingResponse {
		return {
			id: booking.id,
			status: booking.status,
			sessionDurationInMinutes: booking.sessionDurationInMinutes,
			startDateTime: booking.startDateTime
		} as BookingResponse;
	}

	@Get()
	@SuccessResponse(200, 'Ok')
	public async getBookings(): Promise<BookingResponse[]> {
		const bookings = await this.bookingsService.getBookings();
		return this.mapDataModels(bookings);
	}

	@Post()
	@SuccessResponse(201, 'Created')
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

	@Post('{bookingId}/accept')
	@SuccessResponse(204, 'Accepted')
	public async acceptBooking(@Path() bookingId: string, @Body() acceptRequest: BookingAcceptRequest): Promise<any> {
		try {
			await this.bookingsService.acceptBooking(bookingId, acceptRequest);
		} catch (err) {
			logger.error("endpointAcceptBooking:: error: ", err);
			this.setStatus(400);
			return new ErrorResponse(err.message);
		}
	}

	private mapDataModels(bookings: Booking[]): BookingResponse[] {
		return bookings?.map(e => BookingsController.mapDataModel(e));
	}
}
