import { ServiceProvidersService } from "../serviceProviders.service";
import { ServiceProvidersRepository } from "../serviceProviders.repository";
import { Container } from "typescript-ioc";
import { Calendar, Service, ServiceProvider } from "../../models/";
import { ServiceProviderModel } from "../serviceProviders.apicontract";
import { CalendarsService } from "../../calendars/calendars.service";

describe("ServiceProviders.Service", () => {
	beforeAll(() => {
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		Container.bind(CalendarsService).to(CalendarsServiceMock);
	});

	it("should get all service providers", async () => {
		ServiceProvidersRepositoryMock.getServiceProvidersMock = [new ServiceProvider("Monica", null, 1)];
		const result = await Container.get(ServiceProvidersService).getServiceProviders();
		expect(result.length).toBe(1);
	});

	it("should get service provider by Id", async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = new ServiceProvider("Monica", null, 1);
		const result = await Container.get(ServiceProvidersService).getServiceProvider(1);
		expect(result.name).toBe("Monica");
	});

	it("should save a service provider", async () => {
		CalendarsServiceMock.createCalendar = new Calendar();
		const request = new ServiceProviderModel("Timmy");
		const serviceProvider = new ServiceProvider("Timmy", null, 1);
		ServiceProvidersRepositoryMock.save = serviceProvider;
		await Container.get(ServiceProvidersService).saveServiceProviders([request], 1);
		expect(ServiceProvidersRepositoryMock.save.name).toBe("Timmy");
	});
});

class ServiceProvidersRepositoryMock extends ServiceProvidersRepository {
	public static sp: ServiceProvider;
	public static getServiceProvidersMock: ServiceProvider[];
	public static getServiceProviderMock: ServiceProvider;
	public static save: ServiceProvider;


	public async getServiceProviders(): Promise<ServiceProvider[]> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProvidersMock);
	}

	public async getServiceProvider(id: number): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProviderMock);
	}

	public async save(listRequest: ServiceProviderModel): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.save);
	}
}

class CalendarsServiceMock extends CalendarsService {
	public static createCalendar: Calendar;

	public async createCalendar(): Promise<Calendar> {
		return Promise.resolve(CalendarsServiceMock.createCalendar);
	}
}
