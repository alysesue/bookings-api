import { Container } from "typescript-ioc";
import { ServiceProvider } from "../../models";
import { ServiceProvidersController } from "../serviceProviders.controller";
import { ServiceProvidersService } from "../serviceProviders.service";
import { ServiceProviderListRequest, ServiceProviderModel } from "../serviceProviders.apicontract";

describe("ServiceProviders.Controller", () => {
	beforeAll(() => {
		Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
	});

	it('should get service providers', async () => {
		const controller = Container.get(ServiceProvidersController);
		ServiceProvidersServiceMock.mockGetServiceProviders = [new ServiceProvider("Monica"), new ServiceProvider("Timmy")];
		const result = await controller.getServiceProviders();
		expect(result.length).toBe(2);
	});

	it('should get a service provider', async () => {
		const controller = Container.get(ServiceProvidersController);
		ServiceProvidersServiceMock.mockGetServiceProvider = new ServiceProvider("Monica");
		const result = await controller.getServiceProvider("1");
		expect(result.name).toEqual("Monica");
	});
});

class ServiceProvidersServiceMock extends ServiceProvidersService {
	public static mockAddServiceProviders: ServiceProviderListRequest;
	public static mockGetServiceProviders: ServiceProvider[];
	public static mockGetServiceProvider: ServiceProvider;
	public static mockServiceProviderListRequest: ServiceProviderListRequest
	public static mockSpId: string;

	public async getServiceProvider(spId: string): Promise<ServiceProvider> {
		ServiceProvidersServiceMock.mockSpId = spId;
		return Promise.resolve(ServiceProvidersServiceMock.mockGetServiceProvider);
	}
	public async getServiceProviders(): Promise<ServiceProvider[]> {
		return Promise.resolve(ServiceProvidersServiceMock.mockGetServiceProviders);
	}

	public async addServiceProviders(spRequest: ServiceProviderListRequest): Promise<any> {
		ServiceProvidersServiceMock.mockServiceProviderListRequest = { serviceProviders: [{ name: "Monica" }, { name: "Timmy" }] };
		return Promise.resolve(ServiceProvidersServiceMock.mockAddServiceProviders);
	}

}
