import { Container } from 'typescript-ioc';
import { ServicesController } from '../services.controller';
import { ServiceRequest, SetScheduleRequest } from '../service.apicontract';
import { ServicesService } from '../services.service';
import { Schedule, Service, TimeOfDay, TimeslotItem, TimeslotsSchedule } from '../../../models';
import { TimeslotItemRequest } from '../../timeslotItems/timeslotItems.apicontract';
import { Weekday } from '../../../enums/weekday';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

jest.mock('mol-lib-common', () => {
	const actual = jest.requireActual('mol-lib-common');
	const mock = (config: any) => {
		return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => descriptor;
	};
	return {
		...actual,
		MOLAuth: mock,
	};
});

describe('Services controller tests', () => {
	beforeAll(() => {
		Container.bind(ServicesService).to(ServicesServiceMockClass);
	});

	it('should save a new service', async () => {
		ServicesServiceMock.createService.mockReturnValue({ name: 'John' });

		const controller = Container.get(ServicesController);
		const request = new ServiceRequest();
		const result = await controller.createService(request);

		expect(result.name).toBe('John');
	});

	it('should update a service', async () => {
		ServicesServiceMock.updateService.mockReturnValue({ name: 'John' });

		const controller = Container.get(ServicesController);
		const request = new ServiceRequest();
		const result = await controller.updateService(1, request);

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
		expect(response.name).toEqual('John');
	});

	it('should get a timeslotsSchedule', async () => {
		const mockItemId = 11;
		const mockResult = new TimeslotsSchedule();
		const mockItem = TimeslotItem.create(
			1,
			Weekday.Monday,
			TimeOfDay.create({
				hours: 8,
				minutes: 0,
			}),
			TimeOfDay.create({ hours: 9, minutes: 0 }),
		);
		mockItem._id = mockItemId;
		mockResult.timeslotItems = [mockItem];
		ServicesServiceMock.getServiceTimeslotsSchedule.mockReturnValue(mockResult);
		const response = await Container.get(ServicesController).getTimeslotsScheduleByServiceId(1);
		expect(response.timeslots.length).toEqual(1);
		expect(response.timeslots[0].id).toEqual(mockItemId);
	});

	it('should create a timeslot item', async () => {
		const mockItem = TimeslotItem.create(
			1,
			Weekday.Monday,
			TimeOfDay.create({
				hours: 8,
				minutes: 0,
			}),
			TimeOfDay.create({ hours: 9, minutes: 0 }),
		);
		ServicesServiceMock.addTimeslotItem.mockReturnValue(mockItem);

		const request = new TimeslotItemRequest();
		request.weekDay = 4;
		request.startTime = '08:00';
		request.endTime = '09:00';
		const response = await Container.get(ServicesController).createTimeslotItem(1, request);
		expect(response).toBeDefined();
		expect(response.startTime).toEqual('08:00');
	});

	it('should update a timeslot item', async () => {
		const mockItem = TimeslotItem.create(
			1,
			Weekday.Monday,
			TimeOfDay.create({
				hours: 8,
				minutes: 0,
			}),
			TimeOfDay.create({ hours: 9, minutes: 0 }),
		);
		ServicesServiceMock.updateTimeslotItem.mockReturnValue(mockItem);

		const request = new TimeslotItemRequest();
		request.weekDay = 4;
		request.startTime = '08:00';
		request.endTime = '09:00';
		const response = await Container.get(ServicesController).updateTimeslotItem(1, 11, request);
		expect(response).toBeDefined();
	});
});

const ServicesServiceMock = {
	createService: jest.fn(),
	updateService: jest.fn(),
	getServices: jest.fn(),
	setServiceSchedule: jest.fn(),
	getServiceSchedule: jest.fn(),
	getService: jest.fn(),
	deleteTimeslotsScheduleItem: jest.fn(),
	updateTimeslotItem: jest.fn(),
	addTimeslotItem: jest.fn(),
	getServiceTimeslotsSchedule: jest.fn(),
};

class ServicesServiceMockClass extends ServicesService {
	public async createService(request: ServiceRequest): Promise<Service> {
		return ServicesServiceMock.createService();
	}

	public async updateService(id, request: ServiceRequest): Promise<Service> {
		return ServicesServiceMock.updateService();
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

	public async deleteTimeslotsScheduleItem(timeslotId: number) {
		await ServicesServiceMock.deleteTimeslotsScheduleItem(timeslotId);
	}

	public async updateTimeslotItem({
		serviceId,
		timeslotId,
		request,
	}: {
		serviceId: number;
		timeslotId: number;
		request: TimeslotItemRequest;
	}): Promise<TimeslotItem> {
		return ServicesServiceMock.updateTimeslotItem({ serviceId, timeslotId, request });
	}

	public async addTimeslotItem(serviceId: number, request: TimeslotItemRequest): Promise<TimeslotItem> {
		return ServicesServiceMock.addTimeslotItem(serviceId, request);
	}

	public async getServiceTimeslotsSchedule(id: number): Promise<TimeslotsSchedule> {
		return ServicesServiceMock.getServiceTimeslotsSchedule(id);
	}
}
