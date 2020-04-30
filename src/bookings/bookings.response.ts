import { Booking } from "../models/booking";

export class BookingsResponse {
  protected bookings: Booking[];

  constructor(users: Booking[]) {
    this.bookings = users;
  }
}
