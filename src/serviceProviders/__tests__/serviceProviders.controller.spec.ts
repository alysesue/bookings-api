import { Container } from "typescript-ioc";
import { Calendar, Service, ServiceProvider } from "../../models";
import { ServiceProvidersController } from "../serviceProviders.controller";
import { ServiceProvidersService } from "../serviceProviders.service";
import { ServiceProviderModel } from "../serviceProviders.apicontract";
import { CalendarsService } from "../../calendars/calendars.service";

describe("ServiceProviders.Controller", () => {
	beforeAll(() => {
		Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
		Container.bind(CalendarsService).to(CalendarsServiceMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should get service providers', async () => {
		const calendar = new Calendar();
		ServiceProvidersMock.getServiceProviders.mockReturnValue([new ServiceProvider(null, "Monica", calendar), new ServiceProvider(null, "Timmy", calendar)]);

		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProviders();
		expect(result.length).toBe(2);
	});

	it('should get a service provider', async () => {
		ServiceProvidersMock.getServiceProvider.mockReturnValue(new ServiceProvider(null, "Monica", null));

		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProvider(1);

		expect(result.name).toEqual("Monica");
	});

	it('should save multiple service providers', async () => {
		ServiceProvidersMock.save.mockReturnValue([new ServiceProvider(null, "Monica", null), new ServiceProvider(null, "Timmy", null)]);
		const controller = Container.get(ServiceProvidersController);
		const result = await controller.addServiceProviders({
			serviceProviders: [
				{
					"name": "Test"
				}
			]
		});
		const listRequest = ServiceProvidersMock.save.mock.calls[0][0] as ServiceProvider[];

		expect(listRequest.length).toBe(1);
	});

	it('should save multiple service providers as text', async () => {
		ServiceProvidersMock.save.mockReturnValue(
			[
				new ServiceProvider(null, "Monica", null),
				new ServiceProvider(null, "Timmy", null)
			]);
		const controller = Container.get(ServiceProvidersController);

		await controller.addServiceProvidersText("name\nJohn\nMary\nJuliet\n");

		const listRequest = ServiceProvidersMock.save.mock.calls[0][0] as ServiceProvider[];

		expect(listRequest.length).toBe(3);

	});

});

const ServiceProvidersMock = {
	getServiceProvider: jest.fn(),
	getServiceProviders: jest.fn(),
	save: jest.fn(),
};

class ServiceProvidersServiceMock extends ServiceProvidersService {

	public async getServiceProvider(spId: number): Promise<ServiceProvider> {
		return ServiceProvidersMock.getServiceProvider();
	}

	public async getServiceProviders(): Promise<ServiceProvider[]> {
		return ServiceProvidersMock.getServiceProviders();
	}

	public async saveServiceProviders(listRequest: ServiceProviderModel[]): Promise<void> {
		return ServiceProvidersMock.save(listRequest);
	}
}

const CalendarsSvcMock = {
	createCalendar: jest.fn()
};

class CalendarsServiceMock extends CalendarsService {
	public async createCalendar(): Promise<Calendar> {
		return CalendarsSvcMock.createCalendar();
	}
}
