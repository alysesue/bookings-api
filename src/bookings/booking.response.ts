import {BookingStatus} from "../models";

export class BookingResponse {

	public id: number;
	public status: BookingStatus;

	public startDateTime: Date;
	public sessionDurationInMinutes: number;
}
