export class OneOffTimeslotRequest {
	public startDateTime: Date;
	public endDateTime: Date;
	/**
	 * @isInt
	 */
	public capacity: number;
	/**
	 * @isInt
	 */
	public serviceProviderId: number;
}

export class OneOffTimeslotResponse {
	public idSigned: string;
	public startDateTime: Date;
	public endDateTime: Date;
	/**
	 * @isInt
	 */
	public capacity: number;
}
