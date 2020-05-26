import { Container } from "typescript-ioc";
import { ServiceProvider } from "../../models";
import { ServiceProvidersController } from "../serviceProviders.controller";
import { ServiceProvidersService } from "../serviceProviders.service";
import { ServiceProviderModel } from "../serviceProviders.apicontract";

describe("ServiceProviders.Controller", () => {
	beforeAll(() => {
		Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should get service providers', async () => {
		ServiceProvidersMock.getServiceProviders.mockReturnValue([new ServiceProvider("Monica"), new ServiceProvider("Timmy")]);

		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProviders();
		expect(result.length).toBe(2);
	});

	it('should get a service provider', async () => {
		ServiceProvidersMock.getServiceProvider.mockReturnValue(new ServiceProvider("Monica"));

		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProvider("1");

		expect(result.name).toEqual("Monica");
	});

	it('should save multiple service providers', async () => {
		ServiceProvidersMock.save.mockReturnValue([new ServiceProvider("Monica"), new ServiceProvider("Timmy")]);
		const controller = Container.get(ServiceProvidersController);
		const result = await controller.addServiceProviders({
			serviceProviders: [
				{
					"name": "Test"
				}
			]
		});

		expect(result[0].name).toEqual("Monica");
	});

	it('should save multiple service providers as text', async () => {
		ServiceProvidersMock.save.mockReturnValue([new ServiceProvider("Monica"), new ServiceProvider("Timmy")]);
		const controller = Container.get(ServiceProvidersController);

		await controller.addServiceProvidersText("name\nJohn\nMary\nJuliet\n");

		const listRequest = ServiceProvidersMock.save.mock.calls[0][0] as ServiceProvider[];

		expect(listRequest.length).toBe(3)

	});

});

const ServiceProvidersMock = {
	getServiceProvider: jest.fn(),
	getServiceProviders: jest.fn(),
	save: jest.fn(),
}

class ServiceProvidersServiceMock extends ServiceProvidersService {

	public async getServiceProvider(spId: string): Promise<ServiceProvider> {
		return ServiceProvidersMock.getServiceProvider();
	}
	public async getServiceProviders(): Promise<ServiceProvider[]> {
		return ServiceProvidersMock.getServiceProviders();
	}

	public async save(listRequest: ServiceProviderModel[]): Promise<ServiceProvider[]> {
		return ServiceProvidersMock.save(listRequest);
	}
}
