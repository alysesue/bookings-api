import { UserContextSnapshot } from '../../infrastructure/auth/userContext';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../infrastructure/auth/authGroup';
import { Organisation, Service, ServiceProvider, User } from '../entities';
import { UinFinConfiguration } from '../uinFinConfiguration';
import * as uuid from 'uuid';

// tslint:disable-next-line: no-big-function
describe('UinFinConfiguration tests', () => {
	const getAgencyUserContext = (organisation: Organisation): UserContextSnapshot => {
		const agencyMock = User.createAgencyUser({ agencyAppId: 'agency-first-app', agencyName: organisation.name });
		const authGroupsMock = [new OrganisationAdminAuthGroup(agencyMock, [organisation])];
		return { user: agencyMock, authGroups: authGroupsMock };
	};

	const getSingpassContext = (): UserContextSnapshot => {
		const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
		const authGroupsMock = [new CitizenAuthGroup(singpassMock)];
		return { user: singpassMock, authGroups: authGroupsMock };
	};

	const getAnonymousContext = (): UserContextSnapshot => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const authGroupsMock = [new AnonymousAuthGroup(anonymous)];
		return { user: anonymous, authGroups: authGroupsMock };
	};

	const getOrganisationAdminContext = (organisation: Organisation): UserContextSnapshot => {
		const adminMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});
		const authGroupsMock = [new OrganisationAdminAuthGroup(adminMock, [organisation])];
		return { user: adminMock, authGroups: authGroupsMock };
	};

	const getServiceAdminContext = (organisation: Organisation): UserContextSnapshot => {
		const adminMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});
		const service = new Service();
		service.id = 10;
		service.organisationId = organisation.id;

		const authGroupsMock = [new ServiceAdminAuthGroup(adminMock, [service])];
		return { user: adminMock, authGroups: authGroupsMock };
	};

	const getServiceProviderContext = (organisation: Organisation): UserContextSnapshot => {
		const adminMock = User.createAdminUser({
			molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
			userName: 'UserName',
			email: 'test@email.com',
			name: 'Name',
		});
		const service = new Service();
		service.id = 10;
		service.organisationId = organisation.id;
		const serviceProvider = new ServiceProvider();
		serviceProvider.id = 20;
		serviceProvider.service = service;

		const authGroupsMock = [new ServiceProviderAuthGroup(adminMock, serviceProvider)];
		return { user: adminMock, authGroups: authGroupsMock };
	};

	it('should NOT view plain UinFin for citizen', async () => {
		const organisation = new Organisation();
		organisation.name = 'agency1';
		organisation.id = 2;

		const uinFinConfiguration = new UinFinConfiguration(organisation);
		const userContext = getSingpassContext();
		const result = uinFinConfiguration.canViewPlainUinFin(userContext);

		expect(result).toBe(false);
	});

	it('should NOT view plain UinFin for anonymous', async () => {
		const organisation = new Organisation();
		organisation.name = 'agency1';
		organisation.id = 2;

		const uinFinConfiguration = new UinFinConfiguration(organisation);
		const userContext = getAnonymousContext();
		const result = uinFinConfiguration.canViewPlainUinFin(userContext);

		expect(result).toBe(false);
	});

	it('should view plain UinFin for agency user', async () => {
		const organisation = new Organisation();
		organisation.name = 'agency1';
		organisation.id = 2;

		const uinFinConfiguration = new UinFinConfiguration(organisation);
		const userContext = getAgencyUserContext(organisation);
		const result = uinFinConfiguration.canViewPlainUinFin(userContext);

		expect(result).toBe(true);
	});

	it('should NOT view plain UinFin for organisation admin (by default)', async () => {
		const organisation = new Organisation();
		organisation.id = 2;

		const uinFinConfiguration = new UinFinConfiguration(organisation);
		const userContext = getOrganisationAdminContext(organisation);
		const result = uinFinConfiguration.canViewPlainUinFin(userContext);

		expect(result).toBe(false);
	});

	it('should view plain UinFin for organisation admin when set for organisation', async () => {
		const organisation = new Organisation();
		organisation.id = 2;
		organisation.configuration.AuthGroups = {
			OrganisationAdmin: {
				ViewPlainUinFin: true,
			},
		};

		const uinFinConfiguration = new UinFinConfiguration(organisation);
		const userContext = getOrganisationAdminContext(organisation);
		const result = uinFinConfiguration.canViewPlainUinFin(userContext);

		expect(result).toBe(true);
	});

	it('should NOT view plain UinFin for organisation admin when set for another organisation', async () => {
		const organisationA = new Organisation();
		organisationA.id = 2;
		organisationA.configuration.AuthGroups = {
			OrganisationAdmin: {
				ViewPlainUinFin: true,
			},
		};
		const organisationB = new Organisation();
		organisationB.id = 3;

		const uinFinConfiguration = new UinFinConfiguration(organisationA);
		const userContext = getOrganisationAdminContext(organisationB);
		const result = uinFinConfiguration.canViewPlainUinFin(userContext);

		expect(result).toBe(false);
	});

	it('should NOT view plain UinFin for service admin (by default)', async () => {
		const organisation = new Organisation();
		organisation.id = 2;

		const uinFinConfiguration = new UinFinConfiguration(organisation);
		const userContext = getServiceAdminContext(organisation);
		const result = uinFinConfiguration.canViewPlainUinFin(userContext);

		expect(result).toBe(false);
	});

	it('should view plain UinFin for service admin when set for organisation', async () => {
		const organisation = new Organisation();
		organisation.id = 2;
		organisation.configuration.AuthGroups = {
			ServiceAdmin: {
				ViewPlainUinFin: true,
			},
		};

		const uinFinConfiguration = new UinFinConfiguration(organisation);
		const userContext = getServiceAdminContext(organisation);
		const result = uinFinConfiguration.canViewPlainUinFin(userContext);

		expect(result).toBe(true);
	});

	it('should NOT view plain UinFin for service admin when set for another organisation', async () => {
		const organisationA = new Organisation();
		organisationA.id = 2;
		organisationA.configuration.AuthGroups = {
			ServiceAdmin: {
				ViewPlainUinFin: true,
			},
		};
		const organisationB = new Organisation();
		organisationB.id = 3;

		const uinFinConfiguration = new UinFinConfiguration(organisationA);
		const userContext = getServiceAdminContext(organisationB);
		const result = uinFinConfiguration.canViewPlainUinFin(userContext);

		expect(result).toBe(false);
	});

	it('should NOT view plain UinFin for service provider (by default)', async () => {
		const organisation = new Organisation();
		organisation.id = 2;

		const uinFinConfiguration = new UinFinConfiguration(organisation);
		const userContext = getServiceProviderContext(organisation);
		const result = uinFinConfiguration.canViewPlainUinFin(userContext);

		expect(result).toBe(false);
	});

	it('should view plain UinFin for service provider when set for organisation', async () => {
		const organisation = new Organisation();
		organisation.id = 2;
		organisation.configuration.AuthGroups = {
			ServiceProvider: {
				ViewPlainUinFin: true,
			},
		};

		const uinFinConfiguration = new UinFinConfiguration(organisation);
		const userContext = getServiceProviderContext(organisation);
		const result = uinFinConfiguration.canViewPlainUinFin(userContext);

		expect(result).toBe(true);
	});

	it('should NOT view plain UinFin for service provider when set for another organisation', async () => {
		const organisationA = new Organisation();
		organisationA.id = 2;
		organisationA.configuration.AuthGroups = {
			ServiceProvider: {
				ViewPlainUinFin: true,
			},
		};
		const organisationB = new Organisation();
		organisationB.id = 3;

		const uinFinConfiguration = new UinFinConfiguration(organisationA);
		const userContext = getServiceProviderContext(organisationB);
		const result = uinFinConfiguration.canViewPlainUinFin(userContext);

		expect(result).toBe(false);
	});
});
