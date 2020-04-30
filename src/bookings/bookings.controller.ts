import { logger } from "mol-lib-common/debugging/logging/LoggerV2";
import { Inject } from "typescript-ioc";

import { Controller, Get, Post, Route, Body } from "tsoa";
import { BookingsResponse } from "./bookings.response";
import { BookingsService } from "./bookings.service";
import { BookingRequest } from "./booking.request";

@Route("api")
export class BookingsController extends Controller {
  @Inject
  private bookingsService: BookingsService;

  @Get("v1/bookings")
  public async getBookings() {
    try {
      const users = await this.bookingsService.getBookings();
      return new BookingsResponse(users);
    } catch (err) {
      logger.error("endpointGetUsers:: error: ", err);
      throw err;
    }
  }

  @Post("v1/bookings")
  public async postBooking(@Body() bookingRequest: BookingRequest) {
    const booking = await this.bookingsService.save(bookingRequest);
    return new BookingsResponse([booking]);
  }
}
