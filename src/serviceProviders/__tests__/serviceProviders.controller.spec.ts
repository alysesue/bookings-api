import { Container } from "typescript-ioc";
import { Calendar, Schedule, ServiceProvider, TimeslotsSchedule } from "../../models";
import { ServiceProvidersController } from "../serviceProviders.controller";
import { ServiceProvidersService } from "../serviceProviders.service";
import { ServiceProviderModel, SetProviderScheduleRequest } from "../serviceProviders.apicontract";
import { CalendarsService } from "../../calendars/calendars.service";
import { TimeslotItemsService } from "../../timeslotItems/timeslotItems.service";
import { TimeslotsScheduleResponse } from "../../timeslotItems/timeslotItems.apicontract";

describe("ServiceProviders.Controller", () => {
	beforeAll(() => {
		Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
		Container.bind(CalendarsService).to(CalendarsServiceMock);
		Container.bind(TimeslotItemsService).to(TimeslotItemsServiceMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should get service providers', async () => {
		const calendar = new Calendar();
		ServiceProvidersMock.getServiceProviders.mockReturnValue([ServiceProvider.create("Monica", calendar, 1), ServiceProvider.create("Timmy", calendar, 1)]);

		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProviders();
		expect(result.length).toBe(2);
	});

	it('should get a service provider', async () => {
		ServiceProvidersMock.getServiceProvider.mockReturnValue(ServiceProvider.create("Monica", null, 1));

		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProvider(1);

		expect(result.name).toEqual("Monica");
	});

	it('should save multiple service providers', async () => {
		ServiceProvidersMock.save.mockReturnValue([ServiceProvider.create("Monica", null, 1), ServiceProvider.create("Timmy", null, 1)]);
		const controller = Container.get(ServiceProvidersController);
		await controller.addServiceProviders({
			serviceProviders: [
				{
					"name": "Test"
				}
			]
		}, 1);
		const listRequest = ServiceProvidersMock.save.mock.calls[0][0] as ServiceProvider[];

		expect(listRequest.length).toBe(1);
	});

	it('should save multiple service providers as text', async () => {
		ServiceProvidersMock.save.mockReturnValue(
			[
				ServiceProvider.create("Monica", null, 1),
				ServiceProvider.create("Timmy", null, 1)
			]);
		const controller = Container.get(ServiceProvidersController);

		await controller.addServiceProvidersText("name\nJohn\nMary\nJuliet\n", 1);

		const listRequest = ServiceProvidersMock.save.mock.calls[0][0] as ServiceProvider[];

		expect(listRequest.length).toBe(3);

	});


	it('should set provider schedule', async () => {
		ServiceProvidersMock.setProviderSchedule.mockReturnValue(Promise.resolve(new Schedule()));
		const request = new SetProviderScheduleRequest();
		request.scheduleId = 2;

		await Container.get(ServiceProvidersController).setServiceSchedule(1, request);

		expect(ServiceProvidersMock.setProviderSchedule).toBeCalled();
	});

	it('should get provider schedule', async () => {
		ServiceProvidersMock.getProviderSchedule.mockReturnValue(Promise.resolve(new Schedule()));
		await Container.get(ServiceProvidersController).getServiceSchedule(1);

		expect(ServiceProvidersMock.getProviderSchedule).toBeCalled();
	});

	it('should get provider timeslot schedule', async () => {
		TimeslotItemsMock.getTimeslotItemsByServiceProvider.mockReturnValue(Promise.resolve(new TimeslotsSchedule()));
		await Container.get(ServiceProvidersController).getTimeslotsScheduleByServiceProvider(1);
		expect(TimeslotItemsMock.getTimeslotItemsByServiceProvider).toBeCalledTimes(1);
	});

});

const ServiceProvidersMock = {
	getServiceProvider: jest.fn(),
	getServiceProviders: jest.fn(),
	save: jest.fn(),
	setProviderSchedule: jest.fn(),
	getProviderSchedule: jest.fn(),
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

	public async setProviderSchedule(...params): Promise<Schedule> {
		return ServiceProvidersMock.setProviderSchedule(...params);
	}

	public async getProviderSchedule(...params): Promise<Schedule> {
		return ServiceProvidersMock.getProviderSchedule(...params);
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

const TimeslotItemsMock = {
	getTimeslotItemsByServiceProvider: jest.fn(),
};

class TimeslotItemsServiceMock extends TimeslotItemsService {
	public async getTimeslotItemsByServiceProvider(...params): Promise<TimeslotsScheduleResponse> {
			return TimeslotItemsMock.getTimeslotItemsByServiceProvider(...params);
	}
}
