import { Inject, Singleton } from "typescript-ioc";

import { Booking } from "../models";

import { BookingsRepository } from "./bookings.repository";
import { BookingRequest } from "./booking.request";

@Singleton
export class BookingsService {
  private static SessionDurationInMinutes = 60;
  @Inject
  private bookingsRepository: BookingsRepository;

  public async getBookings(): Promise<Booking[]> {
    return this.bookingsRepository.getBookings();
  }

  public async save(bookingRequest: BookingRequest): Promise<Booking> {
    // TODO: validate booking request.
    const booking = BookingsService.createBooking(bookingRequest);
    await this.bookingsRepository.save(booking);
    return booking;
  }

  private static createBooking(bookingRequest: BookingRequest) {
    return new Booking(
      bookingRequest.startDateTime,
      this.SessionDurationInMinutes
    );
  }
}
