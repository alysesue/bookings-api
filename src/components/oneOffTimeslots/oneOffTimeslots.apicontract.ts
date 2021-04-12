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
	public title: string;
	public description: string;
}

export class OneOffTimeslotResponse {
	public idSigned: string;
	public startDateTime: Date;
	public endDateTime: Date;
	/**
	 * @isInt
	 */
	public capacity: number;
	public title: string;
	public description: string;
}
