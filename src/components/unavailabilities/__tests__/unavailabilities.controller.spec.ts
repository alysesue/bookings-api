import { Container } from 'typescript-ioc';
import { UnavailabilitiesService } from '../unavailabilities.service';
import { UnavailabilitiesController, UnavailabilitiesControllerV2 } from '../unavailabilities.controller';
import { UnavailabilityRequestV1, UnavailabilityRequestV2 } from '../unavailabilities.apicontract';
import { Unavailability } from '../../../models';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Unavailabilities Controller V1', () => {
	beforeAll(() => {
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
		const request = new UnavailabilityRequestV1();
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

describe('Unavailabilities Controller V2', () => {
	beforeAll(() => {
		Container.bind(UnavailabilitiesService).to(UnavailabilitiesServiceMockClass);
		Container.bind(IdHasher).to(IdHasherMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		IdHasherMock.decode.mockImplementation((id: string) => Number(id));
	});

	it('should save a new unavailability', async () => {
		const entity = Unavailability.create();
		entity.id = 1;
		entity.start = new Date();
		entity.end = new Date();
		entity.allServiceProviders = true;

		UnavailabilitiesServiceMock.create.mockReturnValue(Promise.resolve(entity));

		const controller = Container.get(UnavailabilitiesControllerV2);
		const request = new UnavailabilityRequestV2();
		request.serviceProviderIds = ['1', '1'];
		const serviceId = '1';
		const result = await controller.addUnavailability(request, serviceId);

		expect(UnavailabilitiesServiceMock.create).toHaveBeenCalledWith({
			serviceId: 1,
			serviceProviderIds: [1, 1],
		});
		expect(result).toBeDefined();
	});

	it('should get unavailabilities', async () => {
		UnavailabilitiesServiceMock.search.mockReturnValue(Promise.resolve([]));
		const controller = Container.get(UnavailabilitiesControllerV2);

		const from = new Date('2020-01-01');
		const to = new Date('2020-01-02');
		const serviceId = '1';
		const serviceProviderId = '1';
		const result = await controller.getUnavailabilities(serviceId, from, to, serviceProviderId);

		expect(UnavailabilitiesServiceMock.search).toHaveBeenCalledWith({
			from,
			to,
			serviceId: 1,
			serviceProviderId: 1,
		});

		expect(result).toBeDefined();
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
