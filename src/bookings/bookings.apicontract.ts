export class BookingAcceptRequest {
	public calendarUUID: string;
}

export class BookingRequest {
	public startDateTime: Date;
}

export class BookingResponse {

	public id: number;
	public status: number;

	public startDateTime: Date;
	public sessionDurationInMinutes: number;
}
