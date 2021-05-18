import { LabelRequestModel, LabelResponseModel } from '../labels/label.apicontract';

export class ServiceResponse {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
	public isStandAlone: boolean;
	public isSpAutoAssigned: boolean;
	public noNric: boolean;
	public labels: LabelResponseModel[];
	public emailSuffix?: string;
}

export class ServiceRequest {
	public name: string;
	public isSpAutoAssigned?: boolean;
	public noNric?: boolean;
	/**
	 * @isInt
	 */
	public organisationId?: number;
	public labels?: LabelRequestModel[];
	public emailSuffix?: string | null;
}
