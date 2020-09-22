import { Container } from 'typescript-ioc';
import {
	Calendar,
	Organisation,
	Service,
	ServiceAdminGroupMap,
	ServiceProvider,
	ServiceProviderGroupMap,
	User,
} from '../../../models';
import { UsersRepository } from '../users.repository';
import { UsersService } from '../users.service';
import { MOLSecurityHeaderKeys } from 'mol-lib-api-contract/auth/common/mol-security-headers';
import { MOLAuthType } from 'mol-lib-api-contract/auth/common/MOLAuthType';
import { OrganisationsService } from '../../../components/organisations/organisations.service';
import {
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { ServicesRepository } from '../../../components/services/services.repository';
import { logger } from 'mol-lib-common/debugging/logging/LoggerV2';
import { ServiceProvidersRepository } from '../../../components/serviceProviders/serviceProviders.repository';

beforeAll(() => {
	Container.bind(UsersRepository).to(UserRepositoryMock);
	Container.bind(OrganisationsService).to(OrganisationsServiceMock);
	Container.bind(ServicesRepository).to(ServicesRepositoryMock);
	Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

jest.mock('mol-lib-common/debugging/logging/LoggerV2', () => {
	const actual = jest.requireActual('mol-lib-common/debugging/logging/LoggerV2');

	const loggerMock = actual.logger;
	loggerMock.warn = jest.fn();

	return {
		...actual,
		logger: loggerMock,
	};
});

function getAdminHeaders() {
	const headers = {};
	headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.ADMIN;
	headers[MOLSecurityHeaderKeys.ADMIN_ID] = 'd080f6ed-3b47-478a-a6c6-dfb5608a199d';
	headers[MOLSecurityHeaderKeys.ADMIN_USERNAME] = 'UserName';
	headers[MOLSecurityHeaderKeys.ADMIN_EMAIL] = 'test@email.com';
	headers[MOLSecurityHeaderKeys.ADMIN_NAME] = 'Name';
	return headers;
}

describe('Users Service', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	it('should return singpass user', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.USER;
		headers[MOLSecurityHeaderKeys.USER_ID] = 'd080f6ed-3b47-478a-a6c6-dfb5608a199d';
		headers[MOLSecurityHeaderKeys.USER_UINFIN] = 'ABC1234';

		const userMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
		UserRepositoryMock.getUserByMolUserId.mockImplementation(() => Promise.resolve(userMock));

		const service = Container.get(UsersService);
		const user = await service.getOrSaveUserFromHeaders(headers);
		expect(UserRepositoryMock.getUserByMolUserId).toBeCalled();
		expect(user.singPassUser).toBeDefined();
	});

	it('should validate singpass user', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.USER;

		const userMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
		UserRepositoryMock.getUserByMolUserId.mockImplementation(() => Promise.resolve(userMock));

		const service = Container.get(UsersService);
		const test = async () => await service.getOrSaveUserFromHeaders(headers);
		await expect(test).rejects.toThrowError();
	});

	it("should save if user doesn't exist", async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.USER;
		headers[MOLSecurityHeaderKeys.USER_ID] = 'd080f6ed-3b47-478a-a6c6-dfb5608a199d';
		headers[MOLSecurityHeaderKeys.USER_UINFIN] = 'ABC1234';

		const userMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

		let savedCalled = false;
		UserRepositoryMock.getUserByMolUserId.mockImplementation(() => Promise.resolve(savedCalled ? userMock : null));
		UserRepositoryMock.save.mockImplementation((entry) => {
			return new Promise((resolve) =>
				setTimeout(() => {
					savedCalled = true;
					resolve(entry);
				}, 10),
			);
		});

		const service = Container.get(UsersService);
		const user = await service.getOrSaveUserFromHeaders(headers);
		expect(UserRepositoryMock.getUserByMolUserId).toBeCalled();
		expect(UserRepositoryMock.save).toBeCalled();
		expect(user.singPassUser).toBeDefined();
	});

	it('should return admin user', async () => {
		const headers = getAdminHeaders();

		const userMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});

		UserRepositoryMock.getUserByMolAdminId.mockImplementation(() => Promise.resolve(userMock));

		const service = Container.get(UsersService);
		const user = await service.getOrSaveUserFromHeaders(headers);
		expect(UserRepositoryMock.getUserByMolAdminId).toBeCalled();
		expect(user.adminUser).toBeDefined();
	});

	it('should validate admin user', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.ADMIN;

		const userMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
		UserRepositoryMock.getUserByMolAdminId.mockImplementation(() => Promise.resolve(userMock));
		const service = Container.get(UsersService);
		const test = async () => await service.getOrSaveUserFromHeaders(headers);
		await expect(test).rejects.toThrowError();
	});

	it('should return null user', async () => {
		const headers = {};
		const service = Container.get(UsersService);
		const user = await service.getOrSaveUserFromHeaders(headers);
		expect(user).toBeNull();
	});

	it('should return null user', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = 'NEW_TYPE';
		const service = Container.get(UsersService);
		const test = async () => await service.getOrSaveUserFromHeaders(headers);

		await expect(test).rejects.toThrowError();
	});

	it('should return no user groups', async () => {
		const headers = getAdminHeaders();
		headers[MOLSecurityHeaderKeys.ADMIN_GROUPS] = '';

		const service = Container.get(UsersService);
		const groups = await service.getAdminUserGroupsFromHeaders(adminMock, headers);

		expect(groups).toBeDefined();
		expect(groups.length).toBe(0);
	});

	it('should return organisation admin user group', async () => {
		const headers = getAdminHeaders();
		headers[MOLSecurityHeaderKeys.ADMIN_GROUPS] = 'bookingsg:org-admin:localorg';

		const organisation = new Organisation();
		organisation.id = 1;
		OrganisationsServiceMock.getOrganisationsForGroups.mockImplementation(() => Promise.resolve([organisation]));

		const groups = await Container.get(UsersService).getAdminUserGroupsFromHeaders(adminMock, headers);
		expect(groups.length).toBe(1);
		expect(groups[0] instanceof OrganisationAdminAuthGroup).toBe(true);
	});

	it('should return service admin user group', async () => {
		const headers = getAdminHeaders();
		headers[MOLSecurityHeaderKeys.ADMIN_GROUPS] =
			'bookingsg:svc-admin-career-coaching:localorg,bookingsg:svc-admin-some-service:localorg';

		const service = new Service();
		service.id = 2;
		service._serviceAdminGroupMap = new ServiceAdminGroupMap();
		service._serviceAdminGroupMap.serviceId = service.id;
		service._serviceAdminGroupMap.serviceOrganisationRef = 'career-coaching:localorg';

		ServicesRepositoryMock.getServicesForUserGroups.mockImplementation(() => Promise.resolve([service]));
		(logger.warn as jest.Mock).mockImplementation(() => {});

		const groups = await Container.get(UsersService).getAdminUserGroupsFromHeaders(adminMock, headers);
		expect(logger.warn as jest.Mock).toBeCalledWith(
			'Service(s) not found in BookingSG for user group(s): bookingsg:svc-admin-some-service:localorg',
		);
		expect(groups.length).toBe(1);
		expect(groups[0] instanceof ServiceAdminAuthGroup).toBe(true);
	});

	it('should return service provider user group', async () => {
		const headers = getAdminHeaders();
		headers[MOLSecurityHeaderKeys.ADMIN_GROUPS] = 'bookingsg:service-provider:localorg';

		const serviceProvider = ServiceProvider.create('Peter', new Calendar(), 1, 'test@email.com', '0000');
		serviceProvider._serviceProviderGroupMap = new ServiceProviderGroupMap();
		serviceProvider._serviceProviderGroupMap.molAdminId = 'd080f6ed-3b47-478a-a6c6-dfb5608a199d';

		ServiceProvidersRepositoryMock.getServiceProviderByMolAdminId.mockImplementation(() =>
			Promise.resolve(serviceProvider),
		);
		(logger.warn as jest.Mock).mockImplementation(() => {});

		const groups = await Container.get(UsersService).getAdminUserGroupsFromHeaders(adminMock, headers);
		expect(groups.length).toBe(1);
		expect(groups[0] instanceof ServiceProviderAuthGroup).toBe(true);
	});

	it('should warn if service provider not found', async () => {
		const headers = getAdminHeaders();
		headers[MOLSecurityHeaderKeys.ADMIN_GROUPS] = 'bookingsg:service-provider:localorg';

		ServiceProvidersRepositoryMock.getServiceProviderByMolAdminId.mockImplementation(() => Promise.resolve(null));
		(logger.warn as jest.Mock).mockImplementation(() => {});

		const groups = await Container.get(UsersService).getAdminUserGroupsFromHeaders(adminMock, headers);
		expect(logger.warn as jest.Mock).toBeCalledWith(
			'Service provider not found in BookingSG for mol-admin-id: d080f6ed-3b47-478a-a6c6-dfb5608a199d',
		);
		expect(groups.length).toBe(0);
	});
});

class UserRepositoryMock extends UsersRepository {
	public static save = jest.fn();
	public static getUserByMolUserId = jest.fn();
	public static getUserByMolAdminId = jest.fn();

	public async save(...params): Promise<any> {
		return await UserRepositoryMock.save(...params);
	}

	public async getUserByMolUserId(...params): Promise<any> {
		return await UserRepositoryMock.getUserByMolUserId(...params);
	}

	public async getUserByMolAdminId(...params): Promise<any> {
		return await UserRepositoryMock.getUserByMolAdminId(...params);
	}
}

class OrganisationsServiceMock extends OrganisationsService {
	public static getOrganisationsForGroups = jest.fn<Promise<Organisation[]>, any>();

	public async getOrganisationsForGroups(...params): Promise<any> {
		return await OrganisationsServiceMock.getOrganisationsForGroups(...params);
	}
}

class ServicesRepositoryMock extends ServicesRepository {
	public static getServicesForUserGroups = jest.fn<Promise<Service[]>, any>();

	public async getServicesForUserGroups(...params): Promise<any> {
		return await ServicesRepositoryMock.getServicesForUserGroups(...params);
	}
}

class ServiceProvidersRepositoryMock extends ServiceProvidersRepository {
	public static getServiceProviderByMolAdminId = jest.fn<Promise<ServiceProvider>, any>();

	public async getServiceProviderByMolAdminId(...params): Promise<any> {
		return await ServiceProvidersRepositoryMock.getServiceProviderByMolAdminId(...params);
	}
}
