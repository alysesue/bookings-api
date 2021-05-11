export class CategoryRequestModel {
	public category: string;
	public categoryName: string;
	public id?: string;
}

export class CategoryResponseModel {
	public id: string;
	public categoryName: string;
	public categoryLabels: string[];
	public serviceId: number;
}
