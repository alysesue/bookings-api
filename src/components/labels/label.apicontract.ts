export class LabelRequestModel {
	public label: string;
	public id?: string;
}

export class LabelResponseModel {
	public id: string;
	public label: string;
	public serviceId: number;
}
