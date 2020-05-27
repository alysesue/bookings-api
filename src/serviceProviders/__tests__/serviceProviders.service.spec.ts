import { ServiceProvidersService } from "../serviceProviders.service";
import { ServiceProvidersRepository } from "../serviceProviders.repository";
import { Container } from "typescript-ioc";
import { ServiceProvider } from "../../models/";
import { ServiceProviderModel } from "../serviceProviders.apicontract";

describe("ServiceProviders.Service", () => {
	beforeAll(() => {
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		// Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);

	});

	it("should get all service providers", async () => {
		ServiceProvidersRepositoryMock.getServiceProvidersMock = [new ServiceProvider("Monica")];
		const result = await new ServiceProvidersService().getServiceProviders();
		expect(result.length).toBe(1);
	});

	it("should get service provider by Id", async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = new ServiceProvider("Monica");
		const result = await new ServiceProvidersService().getServiceProvider("1");
		expect(result.name).toBe("Monica");
	});

	it("should save multiple service providers", async () => {
		const spRequest = [new ServiceProvider("Monica"), new ServiceProvider("Timmy")]
		ServiceProvidersRepositoryMock.saveBulkMock = spRequest;
		const result = await new ServiceProvidersService().save(spRequest);
		expect(result.length).toBe(2);
	});
});

class ServiceProvidersRepositoryMock extends ServiceProvidersRepository {
	public static sp: ServiceProvider;
	public static getServiceProvidersMock: ServiceProvider[];
	public static getServiceProviderMock: ServiceProvider;
	public static saveBulkMock: ServiceProvider[];


	public async getServiceProviders(): Promise<ServiceProvider[]> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProvidersMock);
	}

	public async getServiceProvider(id: string): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProviderMock);
	}

	public async saveBulk(listRequest: ServiceProviderModel[]): Promise<ServiceProvider[]> {
		return Promise.resolve(ServiceProvidersRepositoryMock.saveBulkMock);
	}

	public mapBulkRequest(req: ServiceProviderModel[]): ServiceProvider[] {
		return [new ServiceProvider("Monica")];
	}
}
