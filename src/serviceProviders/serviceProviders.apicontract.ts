import { ServiceProvider } from "../models";

export class ServiceProviderModel {
	public name: string;

	constructor(name: string) {
		this.name = name;
	}
}

export class ServiceProviderListRequest {
	public serviceProviders: ServiceProviderModel[];

	// constructor(spList: ServiceProviderModel[]) {
	// 	spList.forEach(item => {
	// 		this.serviceProviders.push(new ServiceProvider(item.name));
	// 	});
	// }
}
