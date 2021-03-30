import { LabelRequestModel, LabelResponseModel } from '../labels/label.apicontract';

export class ServiceResponse {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
	public isStandAlone: boolean;
	public labels: LabelResponseModel[];
}

export class ServiceRequest {
	public name: string;
	/**
	 * @isInt
	 */
	public organisationId?: number;
	public labels?: LabelRequestModel[];
}
