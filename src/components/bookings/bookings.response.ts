import { Booking } from '../../models/booking';

export class BookingsResponse {

	protected users: Booking[];

	constructor(users: Booking[]) {
		this.users = users;
	}
}
