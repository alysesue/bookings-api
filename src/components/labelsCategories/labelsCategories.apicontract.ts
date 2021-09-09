import { LabelRequestModel, LabelResponseModel } from '../labels/label.apicontract';

export class LabelCategoryRequestModel {
	public categoryName: string;
	public labels?: LabelRequestModel[];
	public id?: string;

	constructor(categoryName?: string, labels?: LabelRequestModel[], id?: string) {
		this.categoryName = categoryName;
		this.labels = labels;
		this.id = id;
	}
}

export class LabelCategoryResponseModel {
	public categoryName: string;
	public labels: LabelResponseModel[];
	public id: string;
	public serviceId: number;

	constructor(categoryName?: string, labels?: LabelResponseModel[], id?: string, serviceId?: number) {
		this.categoryName = categoryName;
		this.labels = labels;
		this.id = id;
		this.serviceId = serviceId;
	}
}
