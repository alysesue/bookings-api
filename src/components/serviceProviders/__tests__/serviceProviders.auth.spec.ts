import { ServiceProvidersActionAuthVisitor } from '../serviceProviders.auth';
import { Organisation, Service, ServiceProvider, User } from '../../../models';
import { CrudAction } from '../../../enums/crudAction';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import * as uuid from 'uuid';

describe('Service providers Auth', () => {
	it('should not be able to create a serviceProvider as anonymous user', () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const groups = [new AnonymousAuthGroup(anonymous)];

		const newServiceProvider = ServiceProvider.create('new sp', 1);
		newServiceProvider.service = new Service();
		const authVisitor = new ServiceProvidersActionAuthVisitor(newServiceProvider, CrudAction.Create);

		expect(authVisitor.hasPermission(groups)).toBe(false);
	});

	it('should not be able to create a serviceProvider as a citizen', () => {
		const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
		const groups = [new CitizenAuthGroup(singpassMock)];

		const newServiceProvider = ServiceProvider.create('new sp', 1);
		newServiceProvider.service = new Service();
		const authVisitor = new ServiceProvidersActionAuthVisitor(newServiceProvider, CrudAction.Create);

		expect(authVisitor.hasPermission(groups)).toBe(false);
	});

	it('should not be able to create a serviceProvider for serviceProvider', () => {
		const serviceProvider = ServiceProvider.create('provider', 1);
		serviceProvider.service = new Service();
		const userGroup = new ServiceProviderAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			serviceProvider,
		);
		const newServiceProvider = ServiceProvider.create('new sp', 1);
		newServiceProvider.service = new Service();
		const authVisitor = new ServiceProvidersActionAuthVisitor(newServiceProvider, CrudAction.Create);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should be able to create a serviceProvider for service admin', () => {
		const service = new Service();
		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[service],
		);
		const serviceProvider = ServiceProvider.create('new sp', 1);
		serviceProvider.service = service;
		const authVisitor = new ServiceProvidersActionAuthVisitor(serviceProvider, CrudAction.Create);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should be able to create a serviceProvider for org admin', () => {
		const organisation = new Organisation();
		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[organisation],
		);
		const serviceProvider = ServiceProvider.create('new sp', 1);
		serviceProvider.service = new Service();
		const authVisitor = new ServiceProvidersActionAuthVisitor(serviceProvider, CrudAction.Create);

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

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should not update service provider for service admin', () => {
		const service = new Service();
		service.id = 1;
		const serviceAdminAuthGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ userName: '', molAdminId: '', email: '', name: '' }),
			[service],
		);

		const serviceProviderToUpdate = ServiceProvider.create('new sp', 1);
		serviceProviderToUpdate.service = service;
		const authVisitor = new ServiceProvidersActionAuthVisitor(serviceProviderToUpdate, CrudAction.Update);

		expect(authVisitor.hasPermission([serviceAdminAuthGroup])).toBe(false);
	});

	it('should not be able to update a service provider not belonging to authorised services for org admin', () => {
		const organisation = new Organisation();
		organisation.id = 1;
		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[organisation],
		);
		const serviceForServiceProvider = new Service();
		serviceForServiceProvider.id = 2;
		// set the organisation id to different from organisation.id
		serviceForServiceProvider.organisationId = 4;

		const serviceProviderToUpdate = ServiceProvider.create('new sp', serviceForServiceProvider.id);
		serviceProviderToUpdate.service = serviceForServiceProvider;
		const authVisitor = new ServiceProvidersActionAuthVisitor(serviceProviderToUpdate, CrudAction.Update);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should not be able to update service provider for service admin not being in the same service', () => {
		const service = new Service();
		service.id = 2;
		const serviceAdminAuthGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ userName: '', molAdminId: '', email: '', name: '' }),
			[service],
		);

		const serviceProviderToUpdate = ServiceProvider.create('new sp', 1);
		serviceProviderToUpdate.service = new Service();
		const authVisitor = new ServiceProvidersActionAuthVisitor(serviceProviderToUpdate, CrudAction.Update);

		expect(authVisitor.hasPermission([serviceAdminAuthGroup])).toBe(false);
	});
});
