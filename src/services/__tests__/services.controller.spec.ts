import { Container } from "typescript-ioc";
import { ServicesController } from "../services.controller";
import { ServiceRequest, SetScheduleRequest } from "../service.apicontract";
import { ServicesService } from "../services.service";
import { Schedule, Service } from "../../models";

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
