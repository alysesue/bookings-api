import { DeleteResult } from "typeorm";
import { Container } from 'typescript-ioc';
import { ServicesService } from "../services.service";
import { ServiceRequest, SetScheduleRequest } from "../service.apicontract";
import { Schedule, Service, TimeOfDay, TimeslotItem, TimeslotsSchedule } from "../../../models";
import { ServicesRepository } from "../services.repository";
import { SchedulesService } from "../../schedules/schedules.service";
import { TimeslotsScheduleService } from "../../timeslotsSchedules/timeslotsSchedule.service";
import { TimeslotItemsService } from "../../timeslotItems/timeslotItems.service";
import { TimeslotItemRequest } from "../../timeslotItems/timeslotItems.apicontract";
import { Weekday } from "../../../enums/weekday";

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const timeslotItemRequest = new TimeslotItemRequest();
const serviceMockWithTemplate = new Service();
const timeslotsScheduleMock = new TimeslotsSchedule();
const timeslotItemMock = TimeslotItem.create(1, Weekday.Monday, TimeOfDay.create({
	hours: 11,
	minutes: 0
}), TimeOfDay.create({ hours: 11, minutes: 30 }));

beforeEach(() => {
	Container.bind(ServicesRepository).to(ServicesRepositoryMockClass);
	Container.bind(SchedulesService).to(SchedulesServiceMockClass);
	Container.bind(TimeslotsScheduleService).to(TimeslotsScheduleMockClass);
	Container.bind(TimeslotItemsService).to(TimeslotItemsServiceMock);
	timeslotItemRequest.weekDay = 0;
	timeslotItemRequest.startTime = "9:00";
	timeslotItemRequest.endTime = "10:00";
	serviceMockWithTemplate.id = 1;
	timeslotItemMock._id = 4;
	timeslotsScheduleMock._id = 1;
	timeslotsScheduleMock.timeslotItems = [timeslotItemMock];
	serviceMockWithTemplate.timeslotsSchedule = timeslotsScheduleMock;
});

afterEach(() => {
	// Clears mock counters, not implementation
	jest.resetAllMocks();
});

describe('Services service tests', () => {
	it('should save service', async () => {
		const request = new ServiceRequest();
		request.name = 'John';
		await Container.get(ServicesService).createService(request);

		expect(ServicesRepositoryMockClass.save.mock.calls[0][0].name).toBe('John');
	});

	it('should update service', async () => {
		const newService = new Service();
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(newService));
		const request = new ServiceRequest();
		request.name = 'John';
		await Container.get(ServicesService).updateService(1, request);

		expect(ServicesRepositoryMockClass.save.mock.calls[0][0].name).toBe('John');
	});

	it('should throw if service not found', async () => {
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(undefined));
		const request = new ServiceRequest();
		request.name = 'John';
		await expect(async () => await Container.get(ServicesService).updateService(1, request)).rejects.toThrowError();
	});

	it('should set service schedule', async () => {
		const newService = new Service();
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(newService));
		SchedulesServiceMock.getSchedule.mockImplementation(() => Promise.resolve(new Schedule()));

		const request = new SetScheduleRequest();
		request.scheduleId = 2;
		const schedule = await Container.get(ServicesService).setServiceSchedule(1, request);

		expect(schedule).toBeDefined();
		expect(newService.schedule).toBe(schedule);
		expect(ServicesRepositoryMockClass.save).toBeCalled();
	});

	it('should set service schedule to null', async () => {
		const newService = new Service();
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(newService));
		SchedulesServiceMock.getSchedule.mockImplementation(() => Promise.resolve());

		const request = new SetScheduleRequest();
		request.scheduleId = null;
		const schedule = await Container.get(ServicesService).setServiceSchedule(1, request);

		expect(schedule).toBe(null);
		expect(newService.schedule).toBe(null);
		expect(SchedulesServiceMock.getSchedule).not.toBeCalled();
		expect(ServicesRepositoryMockClass.save).toBeCalled();
	});

	it('should get service schedule', async () => {
		const newService = new Service();
		newService.scheduleId = 2;
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(newService));
		SchedulesServiceMock.getSchedule.mockImplementation(() => Promise.resolve(new Schedule()));

		const schedule = await Container.get(ServicesService).getServiceSchedule(1);

		expect(schedule).toBeDefined();
		expect(SchedulesServiceMock.getSchedule).toBeCalled();
	});

	it('should throw service not found', async () => {
		// ServicesRepoMock.get.mockImplementation(() => Promise.resolve(null));
		SchedulesServiceMock.getSchedule.mockImplementation(() => Promise.resolve(new Schedule()));

		await expect(async () => {
			const request = new SetScheduleRequest();
			request.scheduleId = 2;
			await Container.get(ServicesService).setServiceSchedule(1, request);
		}).rejects.toThrowError();

		await expect(async () => {
			await Container.get(ServicesService).getServiceSchedule(1);
		}).rejects.toThrowError();
	});

	it('should throw service schedule not found', async () => {
		const newService = new Service();
		ServicesRepositoryMockClass.get.mockImplementation(() => Promise.resolve(newService));
		SchedulesServiceMock.getSchedule.mockImplementation(() => Promise.resolve(null));

		await expect(async () => {
			const request = new SetScheduleRequest();
			request.scheduleId = 3;
			await Container.get(ServicesService).setServiceSchedule(2, request);
		}).rejects.toThrowError();

		await expect(async () => {
			await Container.get(ServicesService).getServiceSchedule(2);
		}).rejects.toThrowError();
	});

	it('should return TimeslotsSchedule', async () => {
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));
		TimeslotsScheduleMockClass.getTimeslotsScheduleById.mockImplementation(() => Promise.resolve(serviceMockWithTemplate.timeslotsSchedule));
		const data = await Container.get(ServicesService).getServiceTimeslotsSchedule(1);
		expect(TimeslotsScheduleMockClass.getTimeslotsScheduleById).toBeCalledTimes(1);
		expect(data).toBe(serviceMockWithTemplate.timeslotsSchedule);
	});

	it('should add timeslotItem', async () => {
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));
		TimeslotsScheduleMockClass.getTimeslotsScheduleById.mockImplementation(() => Promise.resolve(serviceMockWithTemplate.timeslotsSchedule));
		TimeslotItemsServiceMock.createTimeslotItem.mockImplementation(() => Promise.resolve());
		await Container.get(ServicesService).addTimeslotItem(1, timeslotItemRequest);
		expect(TimeslotsScheduleMockClass.getTimeslotsScheduleById).toBeCalledTimes(1);
		expect(TimeslotItemsServiceMock.createTimeslotItem).toBeCalledTimes(1);
	});

	it('should create timeslots schedule if not exist', async () => {
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));
		TimeslotsScheduleMockClass.getTimeslotsScheduleById.mockImplementation(() => Promise.resolve());

		TimeslotItemsServiceMock.createTimeslotItem.mockImplementation(() => Promise.resolve());
		await Container.get(ServicesService).addTimeslotItem(1, timeslotItemRequest);
		expect(TimeslotsScheduleMockClass.getTimeslotsScheduleById).toBeCalledTimes(1);
		expect(TimeslotItemsServiceMock.createTimeslotItem).toBeCalledTimes(1);
		expect(ServicesRepositoryMockClass.save).toBeCalledTimes(1);
	});

	it('should delete timeslotItem', async () => {
		await Container.get(ServicesService).deleteTimeslotsScheduleItem(1);
		expect(TimeslotItemsServiceMock.deleteTimeslot).toBeCalledTimes(1);
	});

	it('should update timeslotItem', async () => {
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));
		TimeslotsScheduleMockClass.getTimeslotsScheduleById.mockImplementation(() => Promise.resolve(serviceMockWithTemplate.timeslotsSchedule));
		await Container.get(ServicesService).updateTimeslotItem({
			serviceId: 1,
			timeslotId: 4,
			request: timeslotItemRequest
		});
		expect(TimeslotItemsServiceMock.updateTimeslotItem).toBeCalledTimes(1);
	});

});

class ServicesRepositoryMockClass extends ServicesRepository {

	public static save = jest.fn();
	public static getService = jest.fn();
	public static get = jest.fn();
	public static getAll = jest.fn();

	public async save(service: Service): Promise<Service> {
		return ServicesRepositoryMockClass.save(service);
	}

	public async get(id: number): Promise<Service> {
		return ServicesRepositoryMockClass.get(id);
	}

	public async getAll(): Promise<Service[]> {
		return ServicesRepositoryMockClass.getAll();
	}

	public async getService(): Promise<Service> {
		return ServicesRepositoryMockClass.getService();
	}
}

const SchedulesServiceMock = {
	getSchedule: jest.fn()
};

class SchedulesServiceMockClass extends SchedulesService {
	public async getSchedule(id: number): Promise<Schedule> {
		return SchedulesServiceMock.getSchedule(id);
	}
}


class TimeslotItemsServiceMock extends TimeslotItemsService {
	public static mapAndSaveTimeslotItemsToTimeslotsSchedule = jest.fn();
	public static deleteTimeslot = jest.fn();
	public static mapAndSaveTimeslotItem = jest.fn();
	public static createTimeslotItem = jest.fn();
	public static updateTimeslotItem = jest.fn();

	public async mapAndSaveTimeslotItem(timeslotsSchedule: TimeslotsSchedule, request: TimeslotItemRequest, entity: TimeslotItem): Promise<TimeslotItem> {
		return await TimeslotItemsServiceMock.mapAndSaveTimeslotItem(timeslotsSchedule, request, entity);
	}

	public async createTimeslotItem(timeslotsSchedule: TimeslotsSchedule, request: TimeslotItemRequest): Promise<TimeslotItem> {
		return await TimeslotItemsServiceMock.createTimeslotItem(timeslotsSchedule, request);
	}

	public async deleteTimeslot(timeslotId: number): Promise<DeleteResult> {
		return await TimeslotItemsServiceMock.deleteTimeslot(timeslotId);
	}

	public async updateTimeslotItem(timeslotsSchedule: TimeslotsSchedule, timeslotId: number, request: TimeslotItemRequest): Promise<TimeslotItem> {
		return await TimeslotItemsServiceMock.updateTimeslotItem(timeslotsSchedule, timeslotId, request);
	}
}

class TimeslotsScheduleMockClass extends TimeslotItemsService {
	public static getTimeslotsScheduleById = jest.fn();

	public async getTimeslotsScheduleById(id: number): Promise<TimeslotsSchedule> {
		return await TimeslotsScheduleMockClass.getTimeslotsScheduleById(id);
	}
}
