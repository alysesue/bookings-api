import { BookingRequest, CitizenBookingRequest } from "../bookings/bookings.apicontract";
import { User } from "../../models";

export class UsersFactory {

	public static createUser(bookingRequest: BookingRequest) {
		switch (bookingRequest) {
			case bookingRequest as CitizenBookingRequest:
				const citizenBookingRequest = bookingRequest as CitizenBookingRequest;
				return User.createSingPassUser(citizenBookingRequest.userMolId, citizenBookingRequest.userUinFin);
			case bookingRequest as BookingRequest:
			default:
				return null;
		}
	}
}