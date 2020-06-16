import { ServiceProvidersService } from "../serviceProviders.service";
import { ServiceProvidersRepository } from "../serviceProviders.repository";
import { Container } from "typescript-ioc";
import { Calendar, Schedule, Service, ServiceProvider } from "../../models";
import { ServiceProviderModel, SetProviderScheduleRequest } from "../serviceProviders.apicontract";
import { CalendarsService } from "../../calendars/calendars.service";
import { SchedulesService } from "../../schedules/schedules.service";

beforeEach(() => {
	Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
	Container.bind(CalendarsService).to(CalendarsServiceMock);
	Container.bind(SchedulesService).to(SchedulesServiceMock);
});

afterEach(() => {
	jest.resetAllMocks();
});

describe("ServiceProviders.Service", () => {
	it("should get all service providers", async () => {
		ServiceProvidersRepositoryMock.getServiceProvidersMock = [ServiceProvider.create("Monica", null, 1)];
		const result = await Container.get(ServiceProvidersService).getServiceProviders();
		expect(result.length).toBe(1);
	});

	it("should get service provider by Id", async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = ServiceProvider.create("Monica", null, 1);
		const result = await Container.get(ServiceProvidersService).getServiceProvider(1);
		expect(result.name).toBe("Monica");
	});

	it("should save a service provider", async () => {
		CalendarsServiceMock.createCalendar = new Calendar();
		const request = new ServiceProviderModel("Timmy");
		const serviceProvider = ServiceProvider.create("Timmy", null, 1);
		ServiceProvidersRepositoryMock.save = serviceProvider;
		await Container.get(ServiceProvidersService).saveServiceProviders([request], 1);
		expect(ServiceProvidersRepositoryMock.save.name).toBe("Timmy");
	});

	it('should set provider schedule', async () => {
		const newSP = new ServiceProvider();
		ServiceProvidersRepositoryMock.getServiceProviderMock = newSP;
		SchedulesServiceObj.getSchedule.mockImplementation(() => Promise.resolve(new Schedule()));

		const request = new SetProviderScheduleRequest();
		request.scheduleId = 2;
		const schedule = await Container.get(ServiceProvidersService).setProviderSchedule(1, request);

		expect(schedule).toBeDefined();
		expect(newSP.schedule).toBe(schedule);
	});

	it('should set provider schedule to null', async () => {
		const newSP = new ServiceProvider();
		ServiceProvidersRepositoryMock.getServiceProviderMock = newSP;
		SchedulesServiceObj.getSchedule.mockImplementation(() => Promise.resolve());

		const request = new SetProviderScheduleRequest();
		request.scheduleId = null;
		const schedule = await Container.get(ServiceProvidersService).setProviderSchedule(1, request);

		expect(schedule).toBe(null);
		expect(newSP.schedule).toBe(null);
		expect(SchedulesServiceObj.getSchedule).not.toBeCalled();
	});

	it('should get provider schedule', async () => {
		const newSP = new ServiceProvider();
		newSP.schedule = new Schedule();
		ServiceProvidersRepositoryMock.getServiceProviderMock = newSP;

		const schedule = await Container.get(ServiceProvidersService).getProviderSchedule(1);

		expect(schedule).toBeDefined();
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

	public async getServiceProvider(...params): Promise<ServiceProvider> {
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

const SchedulesServiceObj = {
	getSchedule: jest.fn()
};

class SchedulesServiceMock extends SchedulesService {
	public async getSchedule(id: number): Promise<Schedule> {
		return SchedulesServiceObj.getSchedule(id);
	}
}
