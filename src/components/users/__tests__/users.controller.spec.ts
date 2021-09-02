import { Container } from 'typescript-ioc';
import { UsersController, UsersControllerV2 } from '../users.controller';
import { MOLSecurityHeaderKeys } from 'mol-lib-api-contract/auth/common/mol-security-headers';
import { MOLAuthType } from 'mol-lib-api-contract/auth/common/MOLAuthType';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { Organisation, Service, User } from '../../../models';
import {
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { UserProfileResponseV1, UserProfileResponseV2 } from '../users.apicontract';
import { ServicesService } from '../../services/services.service';
import { ServiceProvidersService } from '../../serviceProviders/serviceProviders.service';
import { MolServiceAdminUserContract } from '../molUsers/molUsers.apicontract';
import { MolServiceProviderOnboard } from '../../serviceProviders/serviceProviders.apicontract';
import { IdHasher } from '../../../infrastructure/idHasher';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { ServiceProvidersServiceMock } from '../../serviceProviders/__mocks__/serviceProviders.service.mock';
import { ServicesServiceMock } from '../../services/__mocks__/services.service';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

beforeAll(() => {
	Container.bind(UserContext).to(UserContextMock);
	Container.bind(ServicesService).to(ServicesServiceMock);
	Container.bind(ServiceProvidersService).to(ServiceProvidersServiceMock);
});

afterEach(() => {
	jest.resetAllMocks();
});

describe('Users Controller V1', () => {
	it('should get user profile', async () => {
		const headers = {
			[MOLSecurityHeaderKeys.AUTH_TYPE]: MOLAuthType.USER,
			[MOLSecurityHeaderKeys.USER_AUTH_LEVEL]: 2,
			[MOLSecurityHeaderKeys.USER_ID]: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			[MOLSecurityHeaderKeys.USER_UINFIN]: 'ABC1234',
		};

		const userMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(userMock)]));
		UserContextMock.getOtpAddOnMobileNo.mockImplementation(() => '+6588884444');

		const controller = Container.get(UsersController);
		(controller as any).context = {
			headers,
			request: { headers },
		};

		const profile = await controller.getProfile();
		expect(profile.data).toEqual({
			groups: [{ authGroupType: 'citizen' }],
			user: {
				singpass: { uinfin: 'ABC1234' },
				userType: 'singpass',
			},
			otpAddon: {
				mobileNo: '+6588884444',
			},
		} as UserProfileResponseV1);
	});

	it('should get admin profile', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.ADMIN;
		headers[MOLSecurityHeaderKeys.ADMIN_ID] = 'd080f6ed-3b47-478a-a6c6-dfb5608a199d';
		headers[MOLSecurityHeaderKeys.ADMIN_USERNAME] = 'UserName';
		headers[MOLSecurityHeaderKeys.ADMIN_EMAIL] = 'test@email.com';
		headers[MOLSecurityHeaderKeys.ADMIN_NAME] = 'Name';

		const userMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});
		const service = new Service();
		service.id = 1;
		service.name = 'service1';

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(userMock, [service])]),
		);

		const controller = Container.get(UsersController);
		(controller as any).context = {
			headers,
			request: { headers },
		};

		const profile = await controller.getProfile();
		expect(profile.data).toEqual({
			groups: [{ authGroupType: 'service-admin', services: [{ id: 1, name: 'service1' }] }],
			user: { admin: { email: 'test@email.com', name: 'Name' }, userType: 'admin' },
		} as UserProfileResponseV1);
	});

	it('should get admin profile with agencyUserId', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.ADMIN;
		headers[MOLSecurityHeaderKeys.ADMIN_ID] = 'd080f6ed-3b47-478a-a6c6-dfb5608a199d';
		headers[MOLSecurityHeaderKeys.ADMIN_USERNAME] = 'UserName';
		headers[MOLSecurityHeaderKeys.ADMIN_EMAIL] = 'test@email.com';
		headers[MOLSecurityHeaderKeys.ADMIN_NAME] = 'Name';
		headers[MOLSecurityHeaderKeys.ADMIN_GROUPS] = 'service-provider-service1:localorg';
		headers[MOLSecurityHeaderKeys.ADMIN_AGENCY_USER_ID] = '12';

		const userMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
			agencyUserId: 'ABC123',
		});
		const service = new Service();
		service.id = 1;
		service.name = 'service1';

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(userMock, [service])]),
		);

		const controller = Container.get(UsersController);
		(controller as any).context = {
			headers,
			request: { headers },
		};

		const profile = await controller.getProfile();
		expect(profile.data).toEqual({
			groups: [{ authGroupType: 'service-admin', services: [{ id: 1, name: 'service1' }] }],
			user: { admin: { email: 'test@email.com', agencyUserId: 'ABC123', name: 'Name' }, userType: 'admin' },
		} as UserProfileResponseV1);
	});

	it('should get agency profile', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.AGENCY;
		headers[MOLSecurityHeaderKeys.AGENCY_APP_ID] = 'agency-first-app';
		headers[MOLSecurityHeaderKeys.AGENCY_NAME] = 'agency1';

		const userMock = User.createAgencyUser({ agencyAppId: 'agency-first-app', agencyName: 'agency1' });
		const organisation = new Organisation();
		organisation.id = 2;
		organisation.name = 'agency1';

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(userMock, [organisation])]),
		);

		const controller = Container.get(UsersController);
		(controller as any).context = {
			headers,
			request: { headers },
		};

		const profile = await controller.getProfile();
		expect(profile.data).toEqual({
			groups: [{ authGroupType: 'organisation-admin', organisations: [{ id: 2, name: 'agency1' }] }],
			user: { agency: { appId: 'agency-first-app', name: 'agency1' }, userType: 'agency' },
		} as UserProfileResponseV1);
	});

	it('should not get profile', async () => {
		const controller = Container.get(UsersController);

		const headers = {};
		(controller as any).context = { headers };

		const test = async () => await controller.getProfile();
		await expect(test).rejects.toThrowError();
	});

	it('should call createServiceProviders', async () => {
		ServiceProvidersServiceMock.createServiceProvidersMock.mockReturnValue(Promise.resolve([]));
		await Container.get(UsersController).onboardServiceProviders({} as MolServiceProviderOnboard[], '');

		expect(ServiceProvidersServiceMock.createServiceProvidersMock).toBeCalled();
	});

	it('should call createServiceProviders with CSV', async () => {
		ServiceProvidersServiceMock.createServiceProvidersMock.mockReturnValue(Promise.resolve([]));
		await Container.get(UsersController).onboardServiceProvidersCSV('', '');

		expect(ServiceProvidersServiceMock.createServiceProvidersMock).toBeCalled();
	});

	it('should call createServicesAdmins', async () => {
		ServicesServiceMock.createServicesAdmins.mockReturnValue(Promise.resolve([]));
		await Container.get(UsersController).createServicesAdmins({} as MolServiceAdminUserContract[], '');

		expect(ServicesServiceMock.createServicesAdmins).toBeCalled();
	});

	it('should call createServicesAdmins with CSV', async () => {
		ServicesServiceMock.createServicesAdmins.mockReturnValue(Promise.resolve([]));
		await Container.get(UsersController).createServicesAdminsCSV('', '');

		expect(ServicesServiceMock.createServicesAdmins).toBeCalled();
	});
});

describe('Users Controller V2', () => {
	beforeAll(() => {
		Container.bind(IdHasher).to(IdHasherMock);
	});

	it('should get user profile', async () => {
		const headers = {
			[MOLSecurityHeaderKeys.AUTH_TYPE]: MOLAuthType.USER,
			[MOLSecurityHeaderKeys.USER_AUTH_LEVEL]: 2,
			[MOLSecurityHeaderKeys.USER_ID]: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			[MOLSecurityHeaderKeys.USER_UINFIN]: 'ABC1234',
		};

		const userMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new CitizenAuthGroup(userMock)]));

		const controller = Container.get(UsersControllerV2);
		(controller as any).context = {
			headers,
			request: { headers },
		};

		const profile = await controller.getProfile();
		expect(profile.data).toEqual({
			groups: [{ authGroupType: 'citizen' }],
			user: {
				singpass: { uinfin: 'ABC1234' },
				userType: 'singpass',
			},
		} as UserProfileResponseV2);
	});

	it('should get admin profile', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.ADMIN;
		headers[MOLSecurityHeaderKeys.ADMIN_ID] = 'd080f6ed-3b47-478a-a6c6-dfb5608a199d';
		headers[MOLSecurityHeaderKeys.ADMIN_USERNAME] = 'UserName';
		headers[MOLSecurityHeaderKeys.ADMIN_EMAIL] = 'test@email.com';
		headers[MOLSecurityHeaderKeys.ADMIN_NAME] = 'Name';

		const userMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});
		const service = new Service();
		service.id = 1;
		service.name = 'service1';

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(userMock, [service])]),
		);

		IdHasherMock.encode.mockImplementation((id: number) => String(id));

		const controller = Container.get(UsersControllerV2);
		(controller as any).context = {
			headers,
			request: { headers },
		};

		const profile = await controller.getProfile();
		expect(profile.data).toEqual({
			groups: [{ authGroupType: 'service-admin', services: [{ id: '1', name: 'service1' }] }],
			user: { admin: { email: 'test@email.com', name: 'Name' }, userType: 'admin' },
		} as UserProfileResponseV2);
	});

	it('should get admin profile with agencyUserId', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.ADMIN;
		headers[MOLSecurityHeaderKeys.ADMIN_ID] = 'd080f6ed-3b47-478a-a6c6-dfb5608a199d';
		headers[MOLSecurityHeaderKeys.ADMIN_USERNAME] = 'UserName';
		headers[MOLSecurityHeaderKeys.ADMIN_EMAIL] = 'test@email.com';
		headers[MOLSecurityHeaderKeys.ADMIN_NAME] = 'Name';
		headers[MOLSecurityHeaderKeys.ADMIN_GROUPS] = 'service-provider-service1:localorg';
		headers[MOLSecurityHeaderKeys.ADMIN_AGENCY_USER_ID] = '12';

		const userMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
			agencyUserId: 'ABC123',
		});
		const service = new Service();
		service.id = 1;
		service.name = 'service1';

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(userMock, [service])]),
		);

		IdHasherMock.encode.mockImplementation((id: number) => String(id));

		const controller = Container.get(UsersControllerV2);
		(controller as any).context = {
			headers,
			request: { headers },
		};

		const profile = await controller.getProfile();
		expect(profile.data).toEqual({
			groups: [{ authGroupType: 'service-admin', services: [{ id: '1', name: 'service1' }] }],
			user: { admin: { email: 'test@email.com', agencyUserId: 'ABC123', name: 'Name' }, userType: 'admin' },
		} as UserProfileResponseV2);
	});

	it('should get agency profile', async () => {
		const headers = {};
		headers[MOLSecurityHeaderKeys.AUTH_TYPE] = MOLAuthType.AGENCY;
		headers[MOLSecurityHeaderKeys.AGENCY_APP_ID] = 'agency-first-app';
		headers[MOLSecurityHeaderKeys.AGENCY_NAME] = 'agency1';

		const userMock = User.createAgencyUser({ agencyAppId: 'agency-first-app', agencyName: 'agency1' });
		const organisation = new Organisation();
		organisation.id = 2;
		organisation.name = 'agency1';

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(userMock, [organisation])]),
		);

		IdHasherMock.encode.mockImplementation((id: number) => String(id));

		const controller = Container.get(UsersControllerV2);
		(controller as any).context = {
			headers,
			request: { headers },
		};

		const profile = await controller.getProfile();
		expect(profile.data).toEqual({
			groups: [{ authGroupType: 'organisation-admin', organisations: [{ id: '2', name: 'agency1' }] }],
			user: { agency: { appId: 'agency-first-app', name: 'agency1' }, userType: 'agency' },
		} as UserProfileResponseV2);
	});

	it('should not get profile', async () => {
		const controller = Container.get(UsersControllerV2);

		const headers = {};
		(controller as any).context = { headers };

		const test = async () => await controller.getProfile();
		await expect(test).rejects.toThrowError();
	});
});
