import { Inject, Singleton } from "typescript-ioc";

import { Booking } from "../models/booking";

import { BookingsRepository } from "./bookings.repository";
import { BookingRequest } from "./booking.request";
import { BookingsResponse } from "./bookings.response";

@Singleton
export class BookingsService {
  @Inject
  private usersRepository: BookingsRepository;

  public async getBookings(): Promise<Booking[]> {
    return this.usersRepository.getBookings();
  }

  //  public async postBooking(): Promise<BookingsResponse> {}
}
