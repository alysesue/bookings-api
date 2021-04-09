export class LabelRequestModel {
	public label: string;
	public id?: string;
	public serviceId: number;
}

export class LabelResponseModel {
	public id: string;
	public label: string;
	public serviceId: number;
}
