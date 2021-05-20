import { LabelRequestModel, LabelResponseModel } from '../labels/label.apicontract';
import { LabelCategoryRequestModel, LabelCategoryResponseModel } from '../labelsCategories/labelsCategories.apicontract';

export class ServiceResponse {
	/**
	 * @isInt
	 */
	public id: number;
	public name: string;
	public isStandAlone: boolean;
	public isSpAutoAssigned: boolean;
	public labels: LabelResponseModel[];
	public categories: LabelCategoryResponseModel[];
	public emailSuffix?: string;
}

export class ServiceRequest {
	public name: string;
	public isSpAutoAssigned?: boolean;
	/**
	 * @isInt
	 */
	public organisationId?: number;
	public labels?: LabelRequestModel[];
	public categories?: LabelCategoryRequestModel[];
	public emailSuffix?: string | null;
}
