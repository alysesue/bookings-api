import { Container } from "typescript-ioc";
import { Calendar, Schedule, ServiceProvider, TimeOfDay, TimeslotItem, TimeslotsSchedule } from "../../../models";
import { ServiceProvidersController } from "../serviceProviders.controller";
import { ServiceProvidersService } from "../serviceProviders.service";
import { ServiceProviderModel, SetProviderScheduleRequest } from "../serviceProviders.apicontract";
import { CalendarsService } from "../../calendars/calendars.service";
import { TimeslotItemRequest } from "../../timeslotItems/timeslotItems.apicontract";

describe("ServiceProviders.Controller", () => {
	const calendar = new Calendar();
	const sp1 = ServiceProvider.create("Monica", calendar, 1);
	const sp2 = ServiceProvider.create("Timmy", calendar, 1);

	beforeAll(() => {
		Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
		Container.bind(CalendarsService).to(CalendarsServiceMock);
	});
	const mockItem = new TimeslotItem();
	const request = new TimeslotItemRequest();

	beforeEach(()=>{
		mockItem._id = 11;

		mockItem._startTime = TimeOfDay.create({ hours: 8, minutes: 0 });
		mockItem._endTime = TimeOfDay.create({ hours: 9, minutes: 0 });

		request.weekDay = 4;
		request.startTime = "08:00";
		request.endTime = "09:00";
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should get service providers', async () => {

		ServiceProvidersMock.getServiceProviders.mockReturnValue([sp1, sp2]);
		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProviders();
		expect(result.length).toBe(2);
	});

	it('should get service providers with timeslots', async () => {
		const timeslots = new TimeslotsSchedule();
		const timeslotItem = TimeslotItem.create(1,0,TimeOfDay.create({hours: 8, minutes: 0}), TimeOfDay.create({hours: 9, minutes: 0}));
		timeslots.timeslotItems = [timeslotItem];
		sp1.timeslotsSchedule = timeslots;
		ServiceProvidersMock.getServiceProviders.mockReturnValue([sp1]);

		const controller = Container.get(ServiceProvidersController);
		const result = await controller.getServiceProviders(undefined, true);
		expect(result.length).toBe(1);
		expect(result[0].timeslotsSchedule.timeslots[0].weekDay).toBe(timeslotItem._weekDay);
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
		const providerScheduleRequest = new SetProviderScheduleRequest();
		providerScheduleRequest.scheduleId = 2;
		await Container.get(ServiceProvidersController).setServiceSchedule(1, providerScheduleRequest);
		expect(ServiceProvidersMock.setProviderSchedule).toBeCalled();
	});

	it('should get provider schedule', async () => {
		ServiceProvidersMock.getProviderSchedule.mockReturnValue(Promise.resolve(new Schedule()));
		await Container.get(ServiceProvidersController).getServiceSchedule(1);

		expect(ServiceProvidersMock.getProviderSchedule).toBeCalled();
	});

	it('should get provider timeslots schedule', async () => {
		const mockItemId = 11;
		const mockResult = new TimeslotsSchedule();
		mockItem._id = mockItemId;
		mockResult.timeslotItems = [mockItem];
		ServiceProvidersMock.getTimeslotItemsByServiceProviderId.mockReturnValue(mockResult);
		const response = await Container.get(ServiceProvidersController).getTimeslotsScheduleByServiceProviderId(1);
		expect(response.timeslots.length).toEqual(1);
		expect(response.timeslots[0].id).toEqual(mockItemId);
	});

	it('should set provider schedule timeslots', async () => {
		ServiceProvidersMock.createTimeslotItemForServiceProvider.mockReturnValue(mockItem);

		const response = await Container.get(ServiceProvidersController).createTimeslotItem(1, request);
		expect(response).toBeDefined();
		expect(response.startTime).toEqual("08:00");
	});

	it('should update provider schedule timeslots', async () => {
		ServiceProvidersMock.updateTimeslotItemForServiceProvider.mockReturnValue(mockItem);
		const response = await Container.get(ServiceProvidersController).updateTimeslotItem(1, 1, request);
		expect(ServiceProvidersMock.updateTimeslotItemForServiceProvider).toBeCalled();
		expect(response.startTime).toEqual("08:00");
	});

	it('should call deleteTimeslotForServiceProvider', async () => {
		ServiceProvidersMock.deleteTimeslotForServiceProvider.mockReturnValue(mockItem);
		await Container.get(ServiceProvidersController).deleteTimeslotItem(1, 1);
		expect(ServiceProvidersMock.deleteTimeslotForServiceProvider).toBeCalled();

	});

});

const ServiceProvidersMock = {
	getServiceProvider: jest.fn(),
	getServiceProviders: jest.fn(),
	save: jest.fn(),
	setProviderSchedule: jest.fn(),
	getProviderSchedule: jest.fn(),
	getTimeslotItemsByServiceProviderId: jest.fn(),
	createTimeslotItemForServiceProvider: jest.fn(),
	updateTimeslotItemForServiceProvider: jest.fn(),
	deleteTimeslotForServiceProvider: jest.fn()
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

	public async getTimeslotItems(serviceProviderId: number): Promise<TimeslotsSchedule> {
		return ServiceProvidersMock.getTimeslotItemsByServiceProviderId(serviceProviderId);
	}

	public async addTimeslotItem(serviceProviderId: number, timeslotsSchedule: TimeslotItemRequest): Promise<TimeslotItem> {
		return ServiceProvidersMock.createTimeslotItemForServiceProvider(serviceProviderId, timeslotsSchedule);
	}

	public async updateTimeslotItem(serviceProviderId, timeslotId, request): Promise<TimeslotItem> {
		return ServiceProvidersMock.updateTimeslotItemForServiceProvider(serviceProviderId, timeslotId, request);
	}

	public async deleteTimeslotItem(serviceProviderId: number, timeslotsScheduleId: number): Promise<void> {
		return ServiceProvidersMock.deleteTimeslotForServiceProvider(serviceProviderId, timeslotsScheduleId);
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
