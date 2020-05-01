import { Booking } from "../models";

export class BookingsResponse {
	protected bookings: Booking[];

	constructor(users: Booking[]) {
		this.bookings = users;
	}
}
