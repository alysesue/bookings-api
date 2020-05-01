import { Inject, Singleton } from "typescript-ioc";

import { Booking } from "../models/index";

import { BookingsRepository } from "./bookings.repository";
import { BookingRequest } from "./booking.request";

@Singleton
export class BookingsService {
  @Inject
  private bookingsRepository: BookingsRepository;

  public async getBookings(): Promise<Booking[]> {
    return this.bookingsRepository.getBookings();
  }

  public async save(bookingRequest: BookingRequest): Promise<Booking> {
    // validate booking request.
    const booking = this.createBooking(bookingRequest);
    await this.bookingsRepository.save(booking);
    return booking;
  }

  private createBooking(bookingRequest: BookingRequest) {
    const booking = new Booking(
      bookingRequest.startDateTime,
      bookingRequest.sessionDurationInMinutes
    );
    return booking;
  }
}
