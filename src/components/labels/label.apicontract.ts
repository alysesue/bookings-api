export class LabelRequestModel {
	public label: string;
	public id?: string;

	constructor(label?: string, id?: string) {
		this.label = label;
		this.id = id;
	}
}

export class LabelResponseModel {
	public id: string;
	public label: string;
	public serviceId: number;

	constructor(id?: string, label?: string, serviceId?: number) {
		this.id = id;
		this.label = label;
		this.serviceId = serviceId;
	}
}
