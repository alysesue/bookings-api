export class ServiceResponse {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
	public isStandAlone: boolean;
	public isSpAutoAssigned: boolean;
}

export class ServiceRequest {
	public name: string;
	public isSpAutoAssigned: boolean;
	/**
	 * @isInt
	 */
	public organisationId?: number;
}
