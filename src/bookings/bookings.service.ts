import { Inject, Singleton } from "typescript-ioc";

import { Booking, TimeSlot } from "../models/index";

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
    return this.bookingsRepository.save(this.createBooking(bookingRequest));
  }

  private createBooking(bookingRequest: BookingRequest) {
    const timeSlot = new TimeSlot(
      bookingRequest.startDateTime,
      bookingRequest.sessionDuration
    );
    const booking = new Booking();
    booking.timeSlot = timeSlot;
    return booking;
  }
}
