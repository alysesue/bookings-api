import { Container } from "typescript-ioc";
import { Calendar, Schedule, ServiceProvider, TimeslotsSchedule } from "../../models";
import { ServiceProvidersController } from "../serviceProviders.controller";
import { ServiceProvidersService } from "../serviceProviders.service";
import { ServiceProviderModel, SetProviderScheduleRequest } from "../serviceProviders.apicontract";
import { CalendarsService } from "../../calendars/calendars.service";
import { TimeslotItemsService } from "../../timeslotItems/timeslotItems.service";
import {
	TimeslotItemRequest,
	TimeslotItemsResponse,
	TimeslotsScheduleResponse
} from "../../timeslotItems/timeslotItems.apicontract";
import {ServicesController} from "../../services/services.controller";

describe("ServiceProviders.Controller", () => {
	beforeAll(() => {
		Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
		Container.bind(CalendarsService).to(CalendarsServiceMock);
		Container.bind(TimeslotItemsService).to(TimeslotItemsServiceMockClass);
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

	it('should get provider timeslots schedule', async () => {
		const mockItemId = 11;
		const mockResult = new TimeslotsScheduleResponse();
		const mockItem = new TimeslotItemsResponse();
		mockItem.id = mockItemId;
		mockResult.timeslots = [mockItem];
		TimeslotItemsServiceMock.getTimeslotItemsByServiceProviderId.mockReturnValue(mockResult);
		const response = await Container.get(ServiceProvidersController).getTimeslotsScheduleByServiceProviderId(1);
		expect(response.timeslots.length).toEqual(1);
		expect(response.timeslots[0].id).toEqual(mockItemId);
	});

	it('should set provider schedule timeslots', async () => {
		const mockItem = new TimeslotItemsResponse();
		mockItem.id = 11;
		mockItem.startTime = "08:00";
		TimeslotItemsServiceMock.createTimeslotItemForServiceProvider.mockReturnValue(mockItem);

		const request = new TimeslotItemRequest();
		request.weekDay = 4;
		request.startTime = "08:00";
		request.endTime = "09:00";
		const response = await Container.get(ServiceProvidersController).createTimeslotItem(1, request);
		expect(response).toBeDefined();
		expect(response.startTime).toEqual("08:00");
	});
	it('should get provider timeslot schedule', async () => {
		TimeslotItemsMock.getTimeslotItemsByServiceProviderId.mockReturnValue(Promise.resolve(new TimeslotsSchedule()));
		await Container.get(ServiceProvidersController).getTimeslotsScheduleByServiceProvider(1);
		expect(TimeslotItemsMock.getTimeslotItemsByServiceProviderId).toBeCalledTimes(1);
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

	public async getTimeslotItemsByServiceProviderId(...params): Promise<TimeslotsScheduleResponse> {
		return TimeslotItemsMock.getTimeslotItemsByServiceProviderId(...params);
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

const TimeslotItemsServiceMock = {
	getTimeslotItemsByServiceProviderId: jest.fn(),
	createTimeslotItemForServiceProvider: jest.fn(),
	createTimeslotItem: jest.fn(),
	updateTimeslotItem: jest.fn()
};

class TimeslotItemsServiceMockClass extends TimeslotItemsService {
	public async getTimeslotItemsByServiceProviderId(serviceProviderId: number): Promise<TimeslotsScheduleResponse> {
		return TimeslotItemsServiceMock.getTimeslotItemsByServiceProviderId(serviceProviderId);
	}

	public async createTimeslotItemForServiceProvider(serviceProviderId: number, timeslotsScheduleId: TimeslotItemRequest): Promise<TimeslotItemsResponse> {
		return TimeslotItemsServiceMock.createTimeslotItemForServiceProvider(serviceProviderId, timeslotsScheduleId);
	}
}

const TimeslotItemsMock = {
	getTimeslotItemsByServiceProviderId: jest.fn(),
};
