import { Container } from 'typescript-ioc';
import {
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
import { OrganisationsService } from '../../organisations/organisations.service';
import {
	AnonymousAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { logger } from 'mol-lib-common';
import { ServicesRepositoryNoAuth } from '../../services/services.noauth.repository';
import { ServiceProvidersRepositoryNoAuth } from '../../serviceProviders/serviceProviders.noauth.repository';
import { BookingsNoAuthRepository } from '../../bookings/bookings.noauth.repository';
import { BookingsNoAuthRepositoryMock } from '../../bookings/__mocks__/bookings.mocks';
import { OrganisationsNoauthRepository } from '../../organisations/organisations.noauth.repository';

beforeAll(() => {
	Container.bind(UsersRepository).to(UserRepositoryMock);
	Container.bind(OrganisationsService).to(OrganisationsServiceMock);
	Container.bind(ServicesRepositoryNoAuth).to(ServicesRepositoryNoAuthMock);
	Container.bind(OrganisationsNoauthRepository).to(OrganisationsNoauthRepositoryMock);
	Container.bind(ServiceProvidersRepositoryNoAuth).to(ServiceProvidersRepositoryNoAuthMock);
	Container.bind(BookingsNoAuthRepository).to(BookingsNoAuthRepositoryMock);
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

function getAdminHeaders() {
	const headers = {};
	headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.ADMIN;
	headers[MOLSecurityHeaderKeys.ADMIN_ID] = 'd080f6ed-3b47-478a-a6c6-dfb5608a199d';
	headers[MOLSecurityHeaderKeys.ADMIN_USERNAME] = 'UserName';
	headers[MOLSecurityHeaderKeys.ADMIN_EMAIL] = 'test@email.com';
	headers[MOLSecurityHeaderKeys.ADMIN_NAME] = 'Name';
	headers[MOLSecurityHeaderKeys.ADMIN_GROUPS] = 'test';
	return headers;
}

function getAgencyHeaders() {
	const headers = {};
	headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.AGENCY;
	headers[MOLSecurityHeaderKeys.AGENCY_APP_ID] = 'agency-first-app';
	headers[MOLSecurityHeaderKeys.AGENCY_NAME] = 'agency1';
	return headers;
}

// tslint:disable-next-line: no-big-function
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
		const result = await service.getOrSaveUserFromHeaders(headers);
		expect(result).toBe(null);
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

	it('should update admin users with their orgs and services', async () => {
		const headers = getAdminHeaders();

		const userMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});

		UserRepositoryMock.getUserByMolAdminId.mockImplementation(() => Promise.resolve(userMock));

		const service = Container.get(UsersService);
		await service.getOrSaveUserFromHeaders(headers);
		expect(UserRepositoryMock.getUserByMolAdminId).toBeCalled();

		expect(ServicesRepositoryNoAuthMock.getServicesForUserGroups).toBeCalled();
		expect(OrganisationsNoauthRepositoryMock.getOrganisationsForUserGroups).toBeCalled();
		expect(UserRepositoryMock.save).toBeCalled();
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
		const result = await service.getOrSaveUserFromHeaders(headers);
		expect(result).toBe(null);
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
		const result = await service.getOrSaveUserFromHeaders(headers);

		expect(result).toBe(null);
	});

	it('should return no user groups', async () => {
		const headers = getAdminHeaders();
		headers[MOLSecurityHeaderKeys.ADMIN_GROUPS] = '';

		const service = Container.get(UsersService);
		const groups = await service.getUserGroupsFromHeaders(adminMock, headers);

		expect(groups).toBeDefined();
		expect(groups.length).toBe(0);
	});

	it('should return organisation admin user group', async () => {
		const headers = getAdminHeaders();
		headers[MOLSecurityHeaderKeys.ADMIN_GROUPS] = 'bookingsg:org-admin:localorg';

		const organisation = new Organisation();
		organisation.id = 1;
		OrganisationsServiceMock.getOrganisationsForGroups.mockImplementation(() => Promise.resolve([organisation]));

		const groups = await Container.get(UsersService).getUserGroupsFromHeaders(adminMock, headers);
		expect(groups.length).toBe(1);
		expect(groups[0] instanceof OrganisationAdminAuthGroup).toBe(true);
	});

	it('should return organisation admin for agency user', async () => {
		const headers = getAgencyHeaders();
		const agencyUserMock = User.createAgencyUser({ agencyAppId: 'agency-first-app', agencyName: 'agency1' });

		const organisation = new Organisation();
		organisation.id = 1;
		OrganisationsServiceMock.getOrganisationsForGroups.mockImplementation(() => Promise.resolve([organisation]));

		const groups = await Container.get(UsersService).getUserGroupsFromHeaders(agencyUserMock, headers);
		expect(groups.length).toBe(1);
		expect(groups[0] instanceof OrganisationAdminAuthGroup).toBe(true);
	});

	it('should return service admin user group', async () => {
		const headers = getAdminHeaders();
		headers[MOLSecurityHeaderKeys.ADMIN_GROUPS] =
			'bookingsg:svc-admin-career-coaching:localorg,bookingsg:svc-admin-some-service:localorg';

		const service = new Service();
		service.id = 2;
		service.serviceAdminGroupMap = ServiceAdminGroupMap.create('career-coaching:localorg');
		service.serviceAdminGroupMap.serviceId = service.id;

		ServicesRepositoryNoAuthMock.getServicesForUserGroups.mockImplementation(() => Promise.resolve([service]));
		(logger.warn as jest.Mock).mockImplementation(() => {});

		const groups = await Container.get(UsersService).getUserGroupsFromHeaders(adminMock, headers);
		expect(logger.warn as jest.Mock).toBeCalledWith(
			'Service(s) not found in BookingSG for user group(s): bookingsg:svc-admin-some-service:localorg',
		);
		expect(groups.length).toBe(1);
		expect(groups[0] instanceof ServiceAdminAuthGroup).toBe(true);
	});

	it('should return service provider user group', async () => {
		const headers = getAdminHeaders();
		headers[MOLSecurityHeaderKeys.ADMIN_GROUPS] = 'bookingsg:service-provider:localorg';

		const serviceProvider = ServiceProvider.create('Peter', 1, 'test@email.com', '0000');
		serviceProvider.serviceProviderGroupMap = new ServiceProviderGroupMap();
		serviceProvider.serviceProviderGroupMap.molAdminId = 'd080f6ed-3b47-478a-a6c6-dfb5608a199d';

		ServiceProvidersRepositoryNoAuthMock.getServiceProviderByMolAdminId.mockImplementation(() =>
			Promise.resolve(serviceProvider),
		);
		(logger.warn as jest.Mock).mockImplementation(() => {});

		const groups = await Container.get(UsersService).getUserGroupsFromHeaders(adminMock, headers);
		expect(groups.length).toBe(1);
		expect(groups[0] instanceof ServiceProviderAuthGroup).toBe(true);
	});

	it('should warn if service provider not found', async () => {
		const headers = getAdminHeaders();
		headers[MOLSecurityHeaderKeys.ADMIN_GROUPS] = 'bookingsg:service-provider:localorg';

		ServiceProvidersRepositoryNoAuthMock.getServiceProviderByMolAdminId.mockImplementation(() =>
			Promise.resolve(null),
		);
		(logger.warn as jest.Mock).mockImplementation(() => {});

		const groups = await Container.get(UsersService).getUserGroupsFromHeaders(adminMock, headers);
		expect(logger.warn as jest.Mock).toBeCalledWith(
			'Service provider not found in BookingSG for mol-admin-id: d080f6ed-3b47-478a-a6c6-dfb5608a199d',
		);
		expect(groups.length).toBe(0);
	});

	it('should get anonymous user roles', async () => {
		const user = User.createAnonymousUser({
			createdAt: new Date('2020-07-21T00:00Z'),
			trackingId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		});
		const service = Container.get(UsersService);

		const roles = await service.getAnonymousUserRoles(user);

		expect(roles).toEqual([new AnonymousAuthGroup(user)]);
	});

	it('should get Booking info with anonymous user role', async () => {
		const user = User.createAnonymousUser({
			createdAt: new Date('2020-07-21T00:00Z'),
			trackingId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			booking: '81baeb3f-d930-4f48-9808-3ee4debc3d8a',
		});
		BookingsNoAuthRepositoryMock.getBookingInfoByUUID.mockReturnValue(
			Promise.resolve({
				bookingUUID: '81baeb3f-d930-4f48-9808-3ee4debc3d8a',
				bookingId: 1,
				serviceId: 2,
				organisationId: 3,
				serviceProviderId: 4,
			}),
		);

		const service = Container.get(UsersService);

		const roles = await service.getAnonymousUserRoles(user);

		expect(roles).toEqual([
			new AnonymousAuthGroup(user, {
				bookingUUID: '81baeb3f-d930-4f48-9808-3ee4debc3d8a',
				bookingId: 1,
				serviceId: 2,
				organisationId: 3,
				serviceProviderId: 4,
			}),
		]);
	});

	it('should return no roles for anonymous user role (when booking info is not found)', async () => {
		const user = User.createAnonymousUser({
			createdAt: new Date('2020-07-21T00:00Z'),
			trackingId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			booking: '81baeb3f-d930-4f48-9808-3ee4debc3d8a',
		});
		BookingsNoAuthRepositoryMock.getBookingInfoByUUID.mockReturnValue(Promise.resolve(null));

		const service = Container.get(UsersService);

		const roles = await service.getAnonymousUserRoles(user);

		expect(roles).toEqual([]);
	});

	it('should return no anonymous roles for non-anonymous user', async () => {
		const service = Container.get(UsersService);

		const roles = await service.getAnonymousUserRoles(adminMock);

		expect(roles).toEqual([]);
	});

	describe('getOrSaveInternal', () => {});
});

class UserRepositoryMock implements Partial<UsersRepository> {
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

class OrganisationsServiceMock implements Partial<OrganisationsService> {
	public static getOrganisationsForGroups = jest.fn<Promise<Organisation[]>, any>();

	public async getOrganisationsForGroups(...params): Promise<any> {
		return await OrganisationsServiceMock.getOrganisationsForGroups(...params);
	}
}

class ServicesRepositoryNoAuthMock implements Partial<ServicesRepositoryNoAuth> {
	public static getServicesForUserGroups = jest.fn<Promise<Service[]>, any>();

	public async getServicesForUserGroups(...params): Promise<any> {
		return await ServicesRepositoryNoAuthMock.getServicesForUserGroups(...params);
	}
}

class OrganisationsNoauthRepositoryMock implements Partial<OrganisationsNoauthRepository> {
	public static getOrganisationsForUserGroups = jest.fn<Promise<Organisation[]>, any>();

	public async getOrganisationsForUserGroups(...params): Promise<any> {
		return await OrganisationsNoauthRepositoryMock.getOrganisationsForUserGroups(...params);
	}
}

class ServiceProvidersRepositoryNoAuthMock implements Partial<ServiceProvidersRepositoryNoAuth> {
	public static getServiceProviderByMolAdminId = jest.fn<Promise<ServiceProvider>, any>();

	public async getServiceProviderByMolAdminId(...params): Promise<any> {
		return await ServiceProvidersRepositoryNoAuthMock.getServiceProviderByMolAdminId(...params);
	}
}
