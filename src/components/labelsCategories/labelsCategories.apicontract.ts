import {LabelRequestModel, LabelResponseModel} from "../labels/label.apicontract";

export class LabelCategoryRequestModel {
	public name: string;
	public labels?: LabelRequestModel[];
	public id?: string;
}

export class LabelCategoryResponseModel {
	public name: string;
	public labels: LabelResponseModel[];
	public id: string;
	public serviceId: number;
}
