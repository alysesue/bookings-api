import { Container } from 'typescript-ioc';
import { ServicesController } from '../services.controller';
import { ServiceRequest } from '../service.apicontract';
import { ServicesService } from '../services.service';
import {
	ScheduleForm,
	Service,
	TimeOfDay,
	TimeslotItem,
	TimeslotsSchedule,
} from '../../../models';
import { TimeslotItemRequest } from '../../timeslotItems/timeslotItems.apicontract';
import { Weekday } from '../../../enums/weekday';
import { ScheduleFormRequest } from '../../scheduleForms/scheduleForms.apicontract';
import { LabelsMapper } from '../../labels/labels.mapper';

jest.mock('../services.service', () => {
	class ServicesService {}
	return { ServicesService };
});
jest.mock('../../labels/labels.mapper', () => {
	class LabelsMapper {}
	return { LabelsMapper };
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Services controller tests', () => {
	beforeAll(() => {
		Container.bind(ServicesService).to(ServicesServiceMockClass);
		Container.bind(LabelsMapper).to(LabelsMapperMock);
	});

	it('should save a new service', async () => {
		ServicesServiceMock.createService.mockReturnValue({ name: 'John' });

		const controller = Container.get(ServicesController);
		const request = new ServiceRequest();
		const result = await controller.createService(request);

		expect(result.data.name).toBe('John');
	});

	it('should save a new service with labels', async () => {
		ServicesServiceMock.createService.mockReturnValue({ name: 'John', labels: [{ id: 1, labelText: 'label' }] });
		LabelsMapperMock.mapToLabelsResponse.mockReturnValue([{ id: '1', label: 'label' }]);

		const controller = Container.get(ServicesController);
		const request = new ServiceRequest();
		const result = await controller.createService(request);

		expect(result.data.name).toBe('John');
		expect(result.data.labels[0].label).toBe('label');
	});

	it('should return empty label when none provided', async () => {
		ServicesServiceMock.createService.mockReturnValue({ name: 'John' });
		LabelsMapperMock.mapToLabelsResponse.mockReturnValue([]);

		const controller = Container.get(ServicesController);
		const request = new ServiceRequest();
		const result = await controller.createService(request);

		expect(result.data.labels).toHaveLength(0);
	});

	it('should return empty label when none provided', async () => {
		ServicesServiceMock.createService.mockReturnValue({ name: 'John' });

		const controller = Container.get(ServicesController);
		const request = new ServiceRequest();
		const result = await controller.createService(request);

		expect(result.data.labels).toHaveLength(0);
	});

	it('should update a service', async () => {
		ServicesServiceMock.updateService.mockReturnValue({ name: 'John' });

		const controller = Container.get(ServicesController);
		const request = new ServiceRequest();
		const result = await controller.updateService(1, request);

		expect(result.data.name).toBe('John');
	});

	it('should get all services', async () => {
		ServicesServiceMock.getServices.mockReturnValue([{ name: 'John' }, { name: 'Mary' }]);
		LabelsMapperMock.mapToLabelsResponse.mockReturnValue([]);

		const response = await Container.get(ServicesController).getServices();
		expect(response.data).toHaveLength(2);
	});

	it('should set service ScheduleForm', async () => {
		ServicesServiceMock.setServiceScheduleForm.mockReturnValue(Promise.resolve(new ScheduleForm()));
		const request = new ScheduleFormRequest();

		await Container.get(ServicesController).setServiceScheduleForm(1, request);

		expect(ServicesServiceMock.setServiceScheduleForm).toBeCalled();
	});

	it('should get service ScheduleForm', async () => {
		ServicesServiceMock.getServiceScheduleForm.mockReturnValue(Promise.resolve(new ScheduleForm()));
		await Container.get(ServicesController).getServiceScheduleForm(1);

		expect(ServicesServiceMock.getServiceScheduleForm).toBeCalled();
	});

	it('should get a service', async () => {
		ServicesServiceMock.getService.mockReturnValue({ name: 'John' });
		const response = await Container.get(ServicesController).getService(1);
		expect(response.data.name).toEqual('John');
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
		expect(response.data.timeslots.length).toEqual(1);
		expect(response.data.timeslots[0].id).toEqual(mockItemId);
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
		expect(response.data.startTime).toEqual('08:00');
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
	setServiceScheduleForm: jest.fn(),
	getServiceScheduleForm: jest.fn(),
	getService: jest.fn(),
	deleteTimeslotsScheduleItem: jest.fn(),
	updateTimeslotItem: jest.fn(),
	addTimeslotItem: jest.fn(),
	getServiceTimeslotsSchedule: jest.fn(),
};

class ServicesServiceMockClass implements Partial<ServicesService> {
	public async createService(...params): Promise<Service> {
		return ServicesServiceMock.createService(...params);
	}

	public async updateService(...params): Promise<Service> {
		return ServicesServiceMock.updateService(...params);
	}

	public async getServices(): Promise<Service[]> {
		return ServicesServiceMock.getServices();
	}

	public async setServiceScheduleForm(id: number, model: ScheduleFormRequest): Promise<ScheduleForm> {
		return ServicesServiceMock.setServiceScheduleForm(id, model);
	}

	public async getServiceScheduleForm(id: number): Promise<ScheduleForm> {
		return ServicesServiceMock.getServiceScheduleForm(id);
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

class LabelsMapperMock implements Partial<LabelsMapper> {
	public static mapToLabelsResponse = jest.fn();
	public mapToLabelsResponse(...params) {
		return LabelsMapperMock.mapToLabelsResponse(...params);
	}
}
