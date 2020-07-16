import { ServiceProvidersService } from "../serviceProviders.service";
import { ServiceProvidersRepository } from "../serviceProviders.repository";
import { Container } from "typescript-ioc";
import {Calendar, Schedule, Service, ServiceProvider, TimeslotsSchedule} from "../../models";
import { ServiceProviderModel, SetProviderScheduleRequest } from "../serviceProviders.apicontract";
import { CalendarsService } from "../../calendars/calendars.service";
import { SchedulesService } from "../../schedules/schedules.service";
import {ServicesRepository} from "../../services/services.repository";
import {TimeslotsScheduleRepository} from "../../timeslotItems/timeslotsSchedule.repository";

beforeEach(() => {
	Container.bind(TimeslotsScheduleRepository).to(TimeslotsScheduleRepositoryMock);
	Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
	Container.bind(ServicesRepository).to(ServicesRepositoryMock);
	Container.bind(CalendarsService).to(CalendarsServiceMock);
	Container.bind(SchedulesService).to(SchedulesServiceMock);
});

afterEach(() => {
	jest.resetAllMocks();
});

describe("ServiceProviders.Service", () => {
	it("should get all service providers", async () => {
		ServiceProvidersRepositoryMock.getServiceProvidersMock = [serviceProviderMock];
		const result = await Container.get(ServiceProvidersService).getServiceProviders();
		expect(result.length).toBe(1);
	});

	it("should get service provider by Id", async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		const result = await Container.get(ServiceProvidersService).getServiceProvider(1);
		expect(result.name).toBe("Service provider");
	});

	it("should save a service provider", async () => {
		CalendarsServiceMock.createCalendar = new Calendar();
		ServiceProvidersRepositoryMock.save = serviceProviderMock;
		await Container.get(ServiceProvidersService).saveServiceProviders([serviceProviderMock], 1);
		expect(ServiceProvidersRepositoryMock.save.name).toBe("Service provider");
	});

	it('should set provider schedule', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		SchedulesServiceObj.getSchedule.mockImplementation(() => Promise.resolve(new Schedule()));

		const request = new SetProviderScheduleRequest();
		request.scheduleId = 2;
		const schedule = await Container.get(ServiceProvidersService).setProviderSchedule(1, request);

		expect(schedule).toBeDefined();
		expect(serviceProviderMock.schedule).toBe(schedule);
	});

	it('should set provider schedule to null', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		SchedulesServiceObj.getSchedule.mockImplementation(() => Promise.resolve());

		const request = new SetProviderScheduleRequest();
		request.scheduleId = null;
		const schedule = await Container.get(ServiceProvidersService).setProviderSchedule(1, request);

		expect(schedule).toBe(null);
		expect(serviceProviderMock.schedule).toBe(null);
		expect(SchedulesServiceObj.getSchedule).not.toBeCalled();
	});

	it('should get provider schedule', async () => {
		serviceProviderMock.schedule = new Schedule();
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;

		const schedule = await Container.get(ServiceProvidersService).getProviderSchedule(1);

		expect(schedule).toBeDefined();
	});

	it('should get service provider timeslots schedule', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		ServicesRepositoryMock.getServiceMock = serviceMock;

		const serviceProvidersService = Container.get(ServiceProvidersService);

		await serviceProvidersService.getTimeslotItemsByServiceProviderId(1);

		expect(TimeslotsScheduleRepositoryMock.getTimeslotsScheduleByIdMock).toBeCalledWith(serviceProviderMock.timeslotsScheduleId);
	});

	it('should get service timeslots schedule where service provider does not have one', async () => {
		serviceProviderMock.timeslotsScheduleId = null;
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		ServicesRepositoryMock.getServiceMock = serviceMock;

		const serviceProvidersService = Container.get(ServiceProvidersService);

		await serviceProvidersService.getTimeslotItemsByServiceProviderId(1);

		expect(TimeslotsScheduleRepositoryMock.getTimeslotsScheduleByIdMock).toBeCalledWith(serviceMock.timeslotsScheduleId);
		expect(TimeslotsScheduleRepositoryMock.getTimeslotsScheduleByIdMock).not.toHaveBeenCalledWith(serviceProviderMock.timeslotsScheduleId);
	});
});

const serviceProviderMock = new ServiceProvider();
serviceProviderMock.id = 1;
serviceProviderMock.name = 'Service provider';

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

const serviceMock = new Service();

class ServicesRepositoryMock extends ServicesRepository {
	public static getServiceMock: Service;

	public async getService(): Promise<Service> {
		return Promise.resolve(ServicesRepositoryMock.getServiceMock);
	}
}

class TimeslotsScheduleRepositoryMock extends TimeslotsScheduleRepository {
	public static getTimeslotsScheduleByIdMock = jest.fn();

	public async getTimeslotsScheduleById(id: number): Promise<TimeslotsSchedule> {
		return await TimeslotsScheduleRepositoryMock.getTimeslotsScheduleByIdMock(id);
	}
}
