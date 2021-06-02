import { LabelRequestModel, LabelResponseModel } from '../labels/label.apicontract';

export class LabelCategoryRequestModel {
	public categoryName: string;
	public labels?: LabelRequestModel[];
	public id?: string;
}

export class LabelCategoryResponseModel {
	public categoryName: string;
	public labels: LabelResponseModel[];
	public id: string;
	public serviceId: number;
}
