export class ServiceResponse {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
}

export class ServiceRequest {
	public name: string;
	/**
	 * @isInt
	 */
	public organisationId?: number;
}
