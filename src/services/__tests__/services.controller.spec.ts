import { Container } from "typescript-ioc";
import { ServicesController } from "../services.controller";
import { ServiceRequest } from "../service.apicontract";
import { ServicesService } from "../services.service";
import { Service } from "../../models";

describe('Services controller tests', () => {
	beforeAll(() => {
		Container.bind(ServicesService).to(ServicesServiceMockClass);
	});

	it('should save a new service', async () => {
		ServicesServiceMock.createService.mockReturnValue({ name: 'John' })

		const controller = Container.get(ServicesController);
		const request = new ServiceRequest();
		const result = await controller.createService(request);

		expect(result.name).toBe('John');
	});

	it('should get all services', async () => {
		ServicesServiceMock.getServices.mockReturnValue([{ name: 'John' }, { name: 'Mary' }]);

		const response = await Container.get(ServicesController).getServices();
		expect(response).toHaveLength(2)
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
	getService: jest.fn()
}

class ServicesServiceMockClass extends ServicesService {
	async createService(request: ServiceRequest): Promise<Service> {
		return ServicesServiceMock.createService();
	}

	async getServices(): Promise<Service[]> {
		return ServicesServiceMock.getServices();
	}
	async getService(serviceId: number): Promise<Service> {
		return ServicesServiceMock.getService(serviceId);
	}
}
