import { Container } from "typescript-ioc";
import { UnavailabilitiesRepository } from "../unavailabilities.repository";
import { UnavailabilitiesService } from "../unavailabilities.service";
import { UnavailabilityRequest } from "../unavailabilities.apicontract";
import { Calendar, ServiceProvider, Unavailability } from "../../../models";
import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { ServiceProvidersRepository } from "../../serviceProviders/serviceProviders.repository";

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe("Unavailabilities service tests", () => {
	beforeAll(() => {
		Container.bind(UnavailabilitiesRepository).to(UnavailabilitiesRepositoryMock);
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it("should search for unavailabilities", async () => {
		UnavailabilitiesRepositoryMock.search.mockReturnValue(Promise.resolve([]));

		const from = new Date('2020-01-01');
		const to = new Date('2020-01-02');

		const results = await Container.get(UnavailabilitiesService).search({
			from,
			to,
			serviceId: 1,
			serviceProviderId: 2,
		});

		expect(UnavailabilitiesRepositoryMock.search).toHaveBeenCalledWith({
			from,
			to,
			serviceId: 1,
			serviceProviderId: 2,
		});

		expect(results).toBeDefined();
	});

	it("should save an unavailability", async () => {
		const entity = new Unavailability();
		entity.id = 1;
		UnavailabilitiesRepositoryMock.save.mockReturnValue(Promise.resolve(entity));

		const request = new UnavailabilityRequest();
		request.serviceId = 1;
		request.startTime = new Date('2020-01-01');
		request.endTime = new Date('2020-01-02');
		request.allServiceProviders = true;

		const saved = await Container.get(UnavailabilitiesService).create(request);
		expect(UnavailabilitiesRepositoryMock.save).toHaveBeenCalled();
		expect(saved).toBeDefined();
	});

	it("should validate unavailability date range", async () => {
		const entity = new Unavailability();
		entity.id = 1;
		UnavailabilitiesRepositoryMock.save.mockReturnValue(Promise.resolve(entity));

		const request = new UnavailabilityRequest();
		request.serviceId = 1;
		request.startTime = new Date('2020-01-02');
		request.endTime = new Date('2020-01-01');
		request.allServiceProviders = true;

		const service = Container.get(UnavailabilitiesService);
		const test = async () => await service.create(request);
		await expect(test).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Unavailability start time must be less than end time.')
		);
	});

	it("should validate unavailable service providers length", async () => {
		const entity = new Unavailability();
		entity.id = 1;
		UnavailabilitiesRepositoryMock.save.mockReturnValue(Promise.resolve(entity));

		const request = new UnavailabilityRequest();
		request.serviceId = 1;
		request.startTime = new Date('2020-01-01');
		request.endTime = new Date('2020-01-02');
		request.allServiceProviders = false;
		request.serviceProviderIds = [];

		const service = Container.get(UnavailabilitiesService);
		const test = async () => await service.create(request);
		const expectError = new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Unavailability must be applied to at least one service provider (or all).');

		await expect(test).rejects.toStrictEqual(expectError);
		request.serviceProviderIds = undefined;
		await expect(test).rejects.toStrictEqual(expectError);
	});

	it("should validate unavailable service providers exist", async () => {
		const spA = ServiceProvider.create('A', new Calendar(), 1);
		spA.id = 5;
		const spB = ServiceProvider.create('B', new Calendar(), 1);
		spB.id = 2;
		ServiceProvidersRepositoryMock.getServiceProviders.mockReturnValue(Promise.resolve([spA, spB]));

		const request = new UnavailabilityRequest();
		request.serviceId = 1;
		request.startTime = new Date('2020-01-01');
		request.endTime = new Date('2020-01-02');
		request.allServiceProviders = false;
		request.serviceProviderIds = [5, 4, 3, 2];

		const service = Container.get(UnavailabilitiesService);
		const test = async () => await service.create(request);
		const expectError = new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Invalid service provider id(s): 4, 3');

		await expect(test).rejects.toStrictEqual(expectError);
		expect(UnavailabilitiesRepositoryMock.save).not.toHaveBeenCalled();
	});

	it("should check for unavailabilities", async () => {
		UnavailabilitiesRepositoryMock.searchCount.mockReturnValue(Promise.resolve(1));

		const from = new Date('2020-01-01');
		const to = new Date('2020-01-02');

		const isUnavailable = await Container.get(UnavailabilitiesService).isUnavailable({
			from,
			to,
			serviceId: 1,
			serviceProviderId: 2,
		});

		expect(UnavailabilitiesRepositoryMock.searchCount).toHaveBeenCalledWith({
			from,
			to,
			serviceId: 1,
			serviceProviderId: 2,
		});

		expect(isUnavailable).toBe(true);
	});
});

class UnavailabilitiesRepositoryMock extends UnavailabilitiesRepository {
	public static save = jest.fn();
	public static search = jest.fn();
	public static searchCount = jest.fn();

	public async save(...params): Promise<any> {
		return await UnavailabilitiesRepositoryMock.save(...params);
	}

	public async search(...params): Promise<any> {
		return await UnavailabilitiesRepositoryMock.search(...params);
	}

	public async searchCount(...params): Promise<any> {
		return await UnavailabilitiesRepositoryMock.searchCount(...params);
	}
}

class ServiceProvidersRepositoryMock extends ServiceProvidersRepository {
	public static getServiceProviders = jest.fn();

	public async getServiceProviders(...params): Promise<any> {
		return await ServiceProvidersRepositoryMock.getServiceProviders(...params);
	}
}
