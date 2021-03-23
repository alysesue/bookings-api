export class LabelRequestModel {
	public label: string;
	public id?: number;
	public serviceId?: number;
}

export class LabelResponseModel {
	public id: number;
	public label: string;
	public serviceId: number;
}
