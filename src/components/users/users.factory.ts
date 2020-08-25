import { BookingRequest, CitizenBookingRequest } from "../bookings/bookings.apicontract";
import { User } from "../../models";


export class UsersFactory {
	public static createUser(bookingRequest: BookingRequest) {
		if(CitizenBookingRequest.isCitizenBookingRequest(bookingRequest)) {
			const citizenBookingRequest = bookingRequest as CitizenBookingRequest;
			return User.createSingPassUser(citizenBookingRequest.userMolId, citizenBookingRequest.userUinFin);
		}
		else
			return null;
	}
}