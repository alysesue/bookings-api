import { Container } from 'typescript-ioc';
import { UnavailabilitiesRepository } from '../unavailabilities.repository';
import { UnavailabilitiesService } from '../unavailabilities.service';
import { UnavailabilityRequest } from '../unavailabilities.apicontract';
import { Service, ServiceProvider, Unavailability, User } from '../../../models';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { AuthGroup, ServiceAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { UnavailabilitiesActionAuthVisitor } from '../unavailabilities.auth';
import { ServicesRepository } from '../../../components/services/services.repository';

jest.mock('../unavailabilities.auth');

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('Unavailabilities service tests', () => {
	const service = new Service();
	service.id = 1;

	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});
	const visitorObj = {
		hasPermission: jest.fn(),
	};

	beforeEach(() => {
		visitorObj.hasPermission.mockReturnValue(true);
		(UnavailabilitiesActionAuthVisitor as jest.Mock).mockImplementation(() => {
			return visitorObj;
		});
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);
	});

	beforeAll(() => {
		Container.bind(UnavailabilitiesRepository).to(UnavailabilitiesRepositoryMock);
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		Container.bind(ServicesRepository).to(ServicesRepositoryMock);
		Container.bind(UserContext).to(UserContextMock);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should search for unavailabilities', async () => {
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

	it('should save an unavailability', async () => {
		const entity = new Unavailability();
		entity.id = 1;
		UnavailabilitiesRepositoryMock.save.mockReturnValue(Promise.resolve(entity));

		const request = new UnavailabilityRequest();
		request.serviceId = service.id;
		request.startTime = new Date('2020-01-01');
		request.endTime = new Date('2020-01-02');
		request.allServiceProviders = true;

		const saved = await Container.get(UnavailabilitiesService).create(request);
		expect(UnavailabilitiesRepositoryMock.save).toHaveBeenCalled();
		expect(saved).toBeDefined();
	});

	it('should validate unavailability date range', async () => {
		const entity = new Unavailability();
		entity.id = 1;
		UnavailabilitiesRepositoryMock.save.mockReturnValue(Promise.resolve(entity));

		const request = new UnavailabilityRequest();
		request.serviceId = 1;
		request.startTime = new Date('2020-01-02');
		request.endTime = new Date('2020-01-01');
		request.allServiceProviders = true;

		const serviceData = Container.get(UnavailabilitiesService);
		const test = async () => await serviceData.create(request);
		await expect(test).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				'Unavailability start time must be less than end time.',
			),
		);
	});

	it('should validate unavailable service providers length', async () => {
		const entity = new Unavailability();
		entity.id = 1;
		UnavailabilitiesRepositoryMock.save.mockReturnValue(Promise.resolve(entity));

		const request = new UnavailabilityRequest();
		request.serviceId = 1;
		request.startTime = new Date('2020-01-01');
		request.endTime = new Date('2020-01-02');
		request.allServiceProviders = false;
		request.serviceProviderIds = [];

		const serviceData = Container.get(UnavailabilitiesService);
		const test = async () => await serviceData.create(request);
		const expectError = new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
			'Unavailability must be applied to at least one service provider (or all).',
		);

		await expect(test).rejects.toStrictEqual(expectError);
		request.serviceProviderIds = undefined;
		await expect(test).rejects.toStrictEqual(expectError);
	});

	it('should validate unavailable service providers exist', async () => {
		const spA = ServiceProvider.create('A', 1);
		spA.id = 5;
		const spB = ServiceProvider.create('B', 1);
		spB.id = 2;
		ServiceProvidersRepositoryMock.getServiceProviders.mockReturnValue(Promise.resolve([spA, spB]));

		const request = new UnavailabilityRequest();
		request.serviceId = 1;
		request.startTime = new Date('2020-01-01');
		request.endTime = new Date('2020-01-02');
		request.allServiceProviders = false;
		request.serviceProviderIds = [5, 4, 3, 2];

		const serviceData = Container.get(UnavailabilitiesService);
		const test = async () => await serviceData.create(request);
		const expectError = new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
			'Invalid service provider id(s): 4, 3',
		);

		await expect(test).rejects.toStrictEqual(expectError);
		expect(UnavailabilitiesRepositoryMock.save).not.toHaveBeenCalled();
	});

	it('should check for unavailabilities', async () => {
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

	it('should not delete unavailability that does not exist', async () => {
		UnavailabilitiesRepositoryMock.get.mockImplementation(() => Promise.resolve(null));

		const test = async () => await Container.get(UnavailabilitiesService).deleteUnavailability(1);

		expect(test).rejects.toThrowErrorMatchingInlineSnapshot(`"Unavailability entry not found."`);
		expect(visitorObj.hasPermission).not.toBeCalled();
		expect(UnavailabilitiesRepositoryMock.delete).toBeCalledTimes(0);
	});

	it('should delete unavailability that does exist', async () => {
		const tempUnavailability = new Unavailability();
		tempUnavailability.id = 1;
		tempUnavailability.allServiceProviders = true;
		UnavailabilitiesRepositoryMock.get.mockImplementation(() => Promise.resolve(tempUnavailability));
		UnavailabilitiesRepositoryMock.delete.mockImplementation(() => Promise.resolve());

		await Container.get(UnavailabilitiesService).deleteUnavailability(1);

		expect(UnavailabilitiesRepositoryMock.get).toBeCalledTimes(1);
		expect(visitorObj.hasPermission).toBeCalled();
		expect(UnavailabilitiesRepositoryMock.delete).toBeCalledTimes(1);
	});
});

class UnavailabilitiesRepositoryMock implements Partial<UnavailabilitiesRepository> {
	public static save = jest.fn();
	public static get = jest.fn();
	public static search = jest.fn();
	public static searchCount = jest.fn();
	public static delete = jest.fn();

	public async get(...params): Promise<any> {
		return await UnavailabilitiesRepositoryMock.get(...params);
	}

	public async save(...params): Promise<any> {
		return await UnavailabilitiesRepositoryMock.save(...params);
	}

	public async search(...params): Promise<any> {
		return await UnavailabilitiesRepositoryMock.search(...params);
	}

	public async searchCount(...params): Promise<any> {
		return await UnavailabilitiesRepositoryMock.searchCount(...params);
	}

	public async delete(id): Promise<any> {
		return await UnavailabilitiesRepositoryMock.delete(id);
	}
}

class ServiceProvidersRepositoryMock implements Partial<ServiceProvidersRepository> {
	public static getServiceProviders = jest.fn();

	public async getServiceProviders(...params): Promise<any> {
		return await ServiceProvidersRepositoryMock.getServiceProviders(...params);
	}
}
class ServicesRepositoryMock implements Partial<ServicesRepository> {
	public static getService = jest.fn();

	public async getService(...params): Promise<any> {
		return await ServicesRepositoryMock.getService(...params);
	}
}

export class UserContextMock implements Partial<UserContext> {
	public static getCurrentUser = jest.fn<Promise<User>, any>();
	public static getAuthGroups = jest.fn<Promise<AuthGroup[]>, any>();

	public init() {}
	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(...params);
	}

	public async getAuthGroups(...params): Promise<any> {
		return await UserContextMock.getAuthGroups(...params);
	}
}
