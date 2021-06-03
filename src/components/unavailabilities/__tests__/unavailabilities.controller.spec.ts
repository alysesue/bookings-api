import { Container } from 'typescript-ioc';
import { UnavailabilitiesService } from '../unavailabilities.service';
import { UnavailabilitiesController } from '../unavailabilities.controller';
import { UnavailabilityRequest } from '../unavailabilities.apicontract';
import { Unavailability } from '../../../models';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Unavailabilities controller tests', () => {
	beforeEach(() => {
		Container.bind(UnavailabilitiesService).to(UnavailabilitiesServiceMockClass);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should save a new unavailability', async () => {
		const entity = Unavailability.create();
		entity.id = 1;
		entity.start = new Date();
		entity.end = new Date();
		entity.allServiceProviders = true;

		UnavailabilitiesServiceMock.create.mockReturnValue(Promise.resolve(entity));

		const controller = Container.get(UnavailabilitiesController);
		const request = new UnavailabilityRequest();
		const result = await controller.addUnavailability(request, 1);

		expect(UnavailabilitiesServiceMock.create).toHaveBeenCalledWith({
			serviceId: 1,
		});
		expect(result).toBeDefined();
	});

	it('should get unavailabilities', async () => {
		UnavailabilitiesServiceMock.search.mockReturnValue(Promise.resolve([]));
		const controller = Container.get(UnavailabilitiesController);

		const from = new Date('2020-01-01');
		const to = new Date('2020-01-02');
		const result = await controller.getUnavailabilities(1, from, to, 2);

		expect(UnavailabilitiesServiceMock.search).toHaveBeenCalledWith({
			from,
			to,
			serviceId: 1,
			serviceProviderId: 2,
		});

		expect(result).toBeDefined();
	});

	it('should delete unavailability', async () => {
		UnavailabilitiesServiceMock.deleteUnavailability.mockReturnValue(Promise.resolve());

		const controller = Container.get(UnavailabilitiesController);
		const idInput = 1;
		await controller.deleteUnavailability(idInput);

		expect(UnavailabilitiesServiceMock.deleteUnavailability).toHaveBeenCalledWith(1);
	});
});

const UnavailabilitiesServiceMock = {
	create: jest.fn(),
	search: jest.fn(),
	deleteUnavailability: jest.fn(),
};

class UnavailabilitiesServiceMockClass implements Partial<UnavailabilitiesService> {
	public async create(...params): Promise<any> {
		return await UnavailabilitiesServiceMock.create(...params);
	}

	public async search(...params): Promise<any> {
		return await UnavailabilitiesServiceMock.search(...params);
	}

	public async deleteUnavailability(id): Promise<any> {
		return await UnavailabilitiesServiceMock.deleteUnavailability(id);
	}
}
