import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { Inject } from "typescript-ioc";

import { Body, Controller, Get, Post, Route, Response } from "tsoa";
import { BookingsResponse } from "./bookings.response";
import { BookingsService } from "./bookings.service";
import { BookingRequest } from "./booking.request";
import { ErrorResponse } from "./errorResponse";

@Route("api/v1/bookings")
export class BookingsController extends Controller {
  @Inject
  private bookingsService: BookingsService;

  @Get()
  public async getBookings() {
    try {
      const users = await this.bookingsService.getBookings();
      return new BookingsResponse(users);
    } catch (err) {
      logger.error("endpointGetBookings:: error: ", err);
      this.setStatus(400);
      return new ErrorResponse(err.message);
    }
  }

  @Post()
  public async postBooking(@Body() bookingRequest: BookingRequest) {
    try {
      const booking = await this.bookingsService.save(bookingRequest);
      return new BookingsResponse([booking]);
    } catch (err) {
      logger.error("endpointPostBooking:: error: ", err);
      this.setStatus(400);
      return new ErrorResponse(err.message);
    }
  }
}
