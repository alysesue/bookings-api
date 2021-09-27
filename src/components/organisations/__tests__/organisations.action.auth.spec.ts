import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { CrudAction } from '../../../enums/crudAction';
import { Organisation, Service, ServiceProvider, User } from '../../../models/entities';
import * as uuid from 'uuid';
import { OrganisationsActionAuthVisitor } from '../organisations.auth';

describe('Service providers Labels Auth', () => {
	it('should throw errors', () => {
		expect(() => new OrganisationsActionAuthVisitor(null, CrudAction.Create)).toThrowError();
		const organisation = Organisation.create('org1');
		expect(() => new OrganisationsActionAuthVisitor(organisation, CrudAction.Create)).toThrowError();
	});

	it('should not throw error when organisation is valid', () => {
		const organisation = Organisation.create('org1', 1);
		expect(() => new OrganisationsActionAuthVisitor(organisation, CrudAction.Create)).toBeDefined();
	});

	it('should be able to update/read as org admin', () => {
		const organisation = Organisation.create('org1', 1);
		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[organisation],
		);

		const authVisitorUpdate = new OrganisationsActionAuthVisitor(organisation, CrudAction.Update);
		const authVisitorRead = new OrganisationsActionAuthVisitor(organisation, CrudAction.Read);
		expect(authVisitorUpdate.hasPermission([userGroup])).toBe(true);
		expect(authVisitorRead.hasPermission([userGroup])).toBe(true);
	});

	it('should not be able to update as admin user', () => {
		const service = new Service();
		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[service],
		);

		const organisation = Organisation.create('org1', 1);

		const authVisitor = new OrganisationsActionAuthVisitor(organisation, CrudAction.Update);
		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should be able to read as admin user', () => {
		const service = new Service();
		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[service],
		);

		const organisation = Organisation.create('org1', 1);
		userGroup.authorisedServices[0].organisation = organisation;

		const authVisitor = new OrganisationsActionAuthVisitor(organisation, CrudAction.Read);
		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should not be able to update/read as anonymous user', () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const groups = [new AnonymousAuthGroup(anonymous)];
		const organisation = Organisation.create('org1', 1);

		const authVisitorUpdate = new OrganisationsActionAuthVisitor(organisation, CrudAction.Update);
		const authVisitorRead = new OrganisationsActionAuthVisitor(organisation, CrudAction.Read);

		expect(authVisitorUpdate.hasPermission(groups)).toBe(false);
		expect(authVisitorRead.hasPermission(groups)).toBe(false);
	});

	it('should not be able to update/read as service provider', () => {
		const service = new Service();
		const serviceProvider = ServiceProvider.create('new sp', 1);
		serviceProvider.id = 1;
		const userGroup = new ServiceProviderAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			serviceProvider,
		);
		serviceProvider.service = service;

		const organisation = Organisation.create('org1', 1);
		const authVisitorUpdate = new OrganisationsActionAuthVisitor(organisation, CrudAction.Update);
		const authVisitorRead = new OrganisationsActionAuthVisitor(organisation, CrudAction.Read);

		expect(authVisitorUpdate.hasPermission([userGroup])).toBe(false);
		expect(authVisitorRead.hasPermission([userGroup])).toBe(false);
	});

	it('should not be able to update/read as citizen', () => {
		const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
		const userGroups = [new CitizenAuthGroup(singpassMock)];

		const organisation = Organisation.create('org1', 1);
		const authVisitorUpdate = new OrganisationsActionAuthVisitor(organisation, CrudAction.Update);
		const authVisitorRead = new OrganisationsActionAuthVisitor(organisation, CrudAction.Read);

		expect(authVisitorUpdate.hasPermission(userGroups)).toBe(false);
		expect(authVisitorRead.hasPermission(userGroups)).toBe(false);
	});
});
