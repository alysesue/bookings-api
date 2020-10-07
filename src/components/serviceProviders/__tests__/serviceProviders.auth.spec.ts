import { ServiceProvidersActionAuthVisitor } from '../serviceProviders.auth';
import { Organisation, Service, ServiceProvider, User } from '../../../models';
import { CrudAction } from '../../../enums/crudAction';
import {
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';

describe('Service providers Auth', () => {
	it('should not be able to create a serviceProvider for serviceProvider', () => {
		const serviceProvider = ServiceProvider.create('provider', 1);

		const userGroup = new ServiceProviderAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			serviceProvider,
		);
		const authVisitor = new ServiceProvidersActionAuthVisitor(
			ServiceProvider.create('new sp', 1),
			CrudAction.Create,
		);
		authVisitor.visitServiceProvider(userGroup);

		expect(authVisitor.hasPermission([userGroup])).toBeFalsy();
	});

	it('should be able to create a serviceProvider for service admin', () => {
		const service = new Service();
		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[service],
		);
		const authVisitor = new ServiceProvidersActionAuthVisitor(
			ServiceProvider.create('new sp', 1),
			CrudAction.Create,
		);
		authVisitor.visitServiceAdmin(userGroup);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should be able to create a serviceProvider for org admin', () => {
		const organisation = new Organisation();
		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[organisation],
		);
		const authVisitor = new ServiceProvidersActionAuthVisitor(
			ServiceProvider.create('new sp', 1),
			CrudAction.Create,
		);
		authVisitor.visitOrganisationAdmin(userGroup);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should be able to update a serviceProvider for org admin', () => {
		const organisation = new Organisation();
		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[organisation],
		);
		const serviceProviderToUpdate = ServiceProvider.create('new sp', 1);
		serviceProviderToUpdate.service = new Service();
		const authVisitor = new ServiceProvidersActionAuthVisitor(serviceProviderToUpdate, CrudAction.Update);
		authVisitor.visitOrganisationAdmin(userGroup);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});
});
