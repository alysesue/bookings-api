export class ServiceProviderModel {
	public name: string;

	constructor(name: string) {
		this.name = name;
	}
}

export class ServiceProviderListRequest {
	public serviceProviders: ServiceProviderModel[];
}
