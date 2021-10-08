export class ServiceProviderLabelRequestModel {
	public name: string;
	public id?: string;

	constructor(name?: string, id?: string) {
		this.name = name;
		this.id = id;
	}
}

export class ServiceProviderLabelResponseModel {
	public id: string;
	public name: string;
	public organisationId: string;
	public category: ServiceProviderLabelCategoryResponseModel;

	constructor(
		name?: string,
		id?: string,
		organisationId?: string,
		category?: ServiceProviderLabelCategoryResponseModel,
	) {
		this.name = name;
		this.id = id;
		this.organisationId = organisationId;
		this.category = category;
	}
}

export class ServiceProviderLabelCategoryRequestModel {
	public categoryName: string;
	public labels?: ServiceProviderLabelRequestModel[];
	public id?: string;

	constructor(categoryName?: string, labels?: ServiceProviderLabelRequestModel[], id?: string) {
		this.categoryName = categoryName;
		this.labels = labels;
		this.id = id;
	}
}

export class ServiceProviderLabelCategoryResponseModel {
	public categoryName: string;
	public labels?: ServiceProviderLabelResponseModel[];
	public id?: string;
	public organisationId?: string;

	constructor(
		categoryName?: string,
		labels?: ServiceProviderLabelResponseModel[],
		id?: string,
		organisationId?: string,
	) {
		this.categoryName = categoryName;
		this.labels = labels;
		this.id = id;
		this.organisationId = organisationId;
	}
}

export class ServiceProviderLabelRequest {
	public labels?: ServiceProviderLabelRequestModel[];
	public categories?: ServiceProviderLabelCategoryRequestModel[];
}

export class ServiceProviderLabelResponse {
	public labels: ServiceProviderLabelResponseModel[];
	public categories: ServiceProviderLabelCategoryResponseModel[];
}
