import { ServicesService } from "../services.service";
import { Container, Snapshot } from 'typescript-ioc';
import { ServiceRequest, SetScheduleRequest } from "../service.apicontract";
import { Schedule, Service } from "../../models";
import { ServicesRepository } from "../services.repository";
import { SchedulesService } from "../../schedules/schedules.service";

let snapshot: Snapshot;
beforeAll(() => {
	// Store the IoC configuration
	snapshot = Container.snapshot();
});

beforeEach(() => {
	Container.bind(ServicesRepository).to(ServicesRepositoryMockClass);
	Container.bind(SchedulesService).to(SchedulesServiceMockClass);
});

afterEach(() => {
	// Put the IoC configuration back for IService, so other tests can run.
	snapshot.restore();

	// Clears mock counters, not implementation
	jest.clearAllMocks();
});

describe('Services service tests', () => {
	it('should save service', async () => {
		const request = new ServiceRequest();
		request.name = 'John';
		await Container.get(ServicesService).createService(request);

		expect(ServicesRepoMock.save.mock.calls[0][0].name).toBe('John');
	});

	it('should set service schedule', async () => {
		const newService = new Service();
		ServicesRepoMock.get.mockImplementation(() => Promise.resolve(newService));
		SchedulesServiceMock.getSchedule.mockImplementation(() => Promise.resolve(new Schedule()));

		const request = new SetScheduleRequest();
		request.scheduleId = 2;
		const schedule = await Container.get(ServicesService).setServiceSchedule(1, request);

		expect(schedule).toBeDefined();
		expect(newService.schedule).toBe(schedule);
		expect(ServicesRepoMock.save).toBeCalled();
	});

	it('should set service schedule to null', async () => {
		const newService = new Service();
		ServicesRepoMock.get.mockImplementation(() => Promise.resolve(newService));
		SchedulesServiceMock.getSchedule.mockImplementation(() => Promise.resolve());

		const request = new SetScheduleRequest();
		request.scheduleId = null;
		const schedule = await Container.get(ServicesService).setServiceSchedule(1, request);

		expect(schedule).toBe(null);
		expect(newService.schedule).toBe(null);
		expect(SchedulesServiceMock.getSchedule).not.toBeCalled();
		expect(ServicesRepoMock.save).toBeCalled();
	});

	it('should get service schedule', async () => {
		const newService = new Service();
		ServicesRepoMock.get.mockImplementation(() => Promise.resolve(newService));
		SchedulesServiceMock.getSchedule.mockImplementation(() => Promise.resolve(new Schedule()));

		const schedule = await Container.get(ServicesService).getServiceSchedule(1);

		expect(schedule).toBeDefined();
		expect(SchedulesServiceMock.getSchedule).toBeCalled();
	});

	it('should throw service not found', async () => {
		ServicesRepoMock.get.mockImplementation(() => Promise.resolve(null));
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
		ServicesRepoMock.get.mockImplementation(() => Promise.resolve(newService));
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
});

const ServicesRepoMock = {
	save: jest.fn(),
	get: jest.fn(),
	getAll: jest.fn()
};

class ServicesRepositoryMockClass {
	public async save(service: Service): Promise<Service> {
		return ServicesRepoMock.save(service);
	}

	public async get(id: number): Promise<Service> {
		return ServicesRepoMock.get(id);
	}

	public async getAll(): Promise<Service[]> {
		return ServicesRepoMock.getAll();
	}
}

const SchedulesServiceMock = {
	getSchedule: jest.fn()
};

class SchedulesServiceMockClass {
	public async getSchedule(id: number): Promise<Schedule> {
		return SchedulesServiceMock.getSchedule(id);
	}
}
