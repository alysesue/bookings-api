import {LabelRequestModel, LabelResponseModel} from "../labels/label.apicontract";

export class CategoryRequestModel {
	public categoryName: string;
	public labels?: LabelRequestModel[];
	public id?: string;
}

export class CategoryResponseModel {
	public categoryName: string;
	public labels: LabelResponseModel[];
	public id: string;
	public serviceId: number;
}
