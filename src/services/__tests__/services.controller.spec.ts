import { Container } from "typescript-ioc";
import { ServicesController } from "../services.controller";
import { ServiceRequest, SetScheduleRequest } from "../service.apicontract";
import { ServicesService } from "../services.service";
import { Schedule, Service } from "../../models";
import { TimeslotItemsService } from "../../timeslotItems/timeslotItems.service";
import { TimeslotItemRequest, TimeslotItemsResponse, TimeslotsScheduleResponse } from "../../timeslotItems/timeslotItems.apicontract";

describe('Services controller tests', () => {
	beforeAll(() => {
		Container.bind(ServicesService).to(ServicesServiceMockClass);
		Container.bind(TimeslotItemsService).to(TimeslotItemsServiceMockClass);
	});

	it('should save a new service', async () => {
		ServicesServiceMock.createService.mockReturnValue({ name: 'John' });

		const controller = Container.get(ServicesController);
		const request = new ServiceRequest();
		const result = await controller.createService(request);

		expect(result.name).toBe('John');
	});

	it('should get all services', async () => {
		ServicesServiceMock.getServices.mockReturnValue([{ name: 'John' }, { name: 'Mary' }]);

		const response = await Container.get(ServicesController).getServices();
		expect(response).toHaveLength(2);
	});

	it('should set service schedule', async () => {
		ServicesServiceMock.setServiceSchedule.mockReturnValue(Promise.resolve(new Schedule()));
		const request = new SetScheduleRequest();
		request.scheduleId = 2;

		await Container.get(ServicesController).setServiceSchedule(1, request);

		expect(ServicesServiceMock.setServiceSchedule).toBeCalled();
	});

	it('should get service schedule', async () => {
		ServicesServiceMock.getServiceSchedule.mockReturnValue(Promise.resolve(new Schedule()));
		await Container.get(ServicesController).getServiceSchedule(1);

		expect(ServicesServiceMock.getServiceSchedule).toBeCalled();
	});

	it('should get a service', async () => {
		ServicesServiceMock.getService.mockReturnValue({ name: 'John' });
		const response = await Container.get(ServicesController).getService(1);
		expect(response.name).toEqual("John");
	});

	it('should get a timeslotsSchedule', async () => {
		const mockItemId = 11;
		const mockResult = new TimeslotsScheduleResponse();
		const mockItem = new TimeslotItemsResponse();
		mockItem.id = mockItemId;
		mockResult.timeslots = [mockItem];
		TimeslotItemsServiceMock.getTimeslotItemsByServiceId.mockReturnValue(mockResult);
		const response = await Container.get(ServicesController).getTimeslotsScheduleByServiceId(1);
		expect(response.timeslots.length).toEqual(1);
		expect(response.timeslots[0].id).toEqual(mockItemId);
	});

	it('should create a timeslot item', async () => {
		const mockItem = new TimeslotItemsResponse();
		mockItem.id = 11;
		mockItem.startTime = "08:00";
		TimeslotItemsServiceMock.createTimeslotItem.mockReturnValue(mockItem);

		const request = new TimeslotItemRequest();
		request.weekDay = 4;
		request.startTime = "08:00";
		request.endTime = "09:00";
		const response = await Container.get(ServicesController).createTimeslotItem(1, request);
		expect(response).toBeDefined();
		expect(response.startTime).toEqual("08:00");
	});

});

const ServicesServiceMock = {
	createService: jest.fn(),
	getServices: jest.fn(),
	setServiceSchedule: jest.fn(),
	getServiceSchedule: jest.fn(),
	getService: jest.fn()
};

class ServicesServiceMockClass extends ServicesService {
	public async createService(request: ServiceRequest): Promise<Service> {
		return ServicesServiceMock.createService();
	}

	public async getServices(): Promise<Service[]> {
		return ServicesServiceMock.getServices();
	}

	public async setServiceSchedule(id: number, model: SetScheduleRequest): Promise<Schedule> {
		return ServicesServiceMock.setServiceSchedule(id, model);
	}

	public async getServiceSchedule(id: number): Promise<Schedule> {
		return ServicesServiceMock.getServiceSchedule(id);
	}

	public async getService(serviceId: number): Promise<Service> {
		return ServicesServiceMock.getService(serviceId);
	}
}

const TimeslotItemsServiceMock = {
	getTimeslotItemsByServiceId: jest.fn(),
	createTimeslotItem: jest.fn()
};


class TimeslotItemsServiceMockClass extends TimeslotItemsService {
	public async getTimeslotItemsByServiceId(serviceId: number): Promise<TimeslotsScheduleResponse> {
		return TimeslotItemsServiceMock.getTimeslotItemsByServiceId(serviceId);
	}

	public async createTimeslotItem(serviceId: number, request: TimeslotItemRequest): Promise<TimeslotItemsResponse> {
		return TimeslotItemsServiceMock.createTimeslotItem(serviceId, request);
	}
}
