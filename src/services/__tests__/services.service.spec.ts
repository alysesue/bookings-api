import { ServicesService } from "../services.service";
import { Container } from "typescript-ioc";
import { ServiceRequest } from "../service.apicontract";
import { Service } from "../../models";
import { ServicesRepository } from "../services.repository";

describe('Services service tests', () => {
	it('should save service', async () => {
		Container.bind(ServicesRepository).to(ServicesRepositoryMockClass);
		const request = new ServiceRequest();
		request.name = 'John';
		await Container.get(ServicesService).createService(request);

		expect(ServicesRepoMock.create.mock.calls[0][0].name).toBe('John')
	});
});

const ServicesRepoMock = {
	create: jest.fn()
}

class ServicesRepositoryMockClass extends ServicesRepository {
	async save(service: Service): Promise<Service> {
		return ServicesRepoMock.create(service);
	}
}
