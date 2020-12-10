import { Organisation, Service, ServiceProvider, User } from '../../../models';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { ServicesActionAuthVisitor } from '../services.auth';
import { CrudAction } from '../../../enums/crudAction';
import * as uuid from 'uuid';

// tslint:disable-next-line: no-big-function
describe('Service action auth tests', () => {
	it('should create a service by organisation admin', () => {
		const organisation = new Organisation();
		organisation.id = 1;
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', email: '', name: '', userName: '' }),
			[organisation],
		);
		const authVisitor = new ServicesActionAuthVisitor(service, CrudAction.Create);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should not create a service by organisation admin for another organisation', () => {
		const organisation = new Organisation();
		organisation.id = 1;
		const service = new Service();
		service.organisationId = 2;
		service.id = 1;

		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', email: '', name: '', userName: '' }),
			[organisation],
		);
		const authVisitor = new ServicesActionAuthVisitor(service, CrudAction.Create);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should not create a service by service admin', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[service],
		);
		const authVisitor = new ServicesActionAuthVisitor(service, CrudAction.Create);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should update service by organisation admin', () => {
		const organisation = new Organisation();
		organisation.id = 1;
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', email: '', name: '', userName: '' }),
			[organisation],
		);
		const authVisitor = new ServicesActionAuthVisitor(service, CrudAction.Update);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should update service by service admin', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[service],
		);
		const authVisitor = new ServicesActionAuthVisitor(service, CrudAction.Update);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should not update service by organisation admin for another organisation', () => {
		const organisation = new Organisation();
		organisation.id = 1;
		const service = new Service();
		service.organisationId = 2;
		service.id = 1;

		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', email: '', name: '', userName: '' }),
			[organisation],
		);
		const authVisitor = new ServicesActionAuthVisitor(service, CrudAction.Update);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should not update service by service admin for another service', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const serviceOfServiceAdmin = new Service();
		serviceOfServiceAdmin.organisationId = 1;
		serviceOfServiceAdmin.id = 2;

		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[service],
		);
		const authVisitor = new ServicesActionAuthVisitor(serviceOfServiceAdmin, CrudAction.Update);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should delete service by organisation admin', () => {
		const organisation = new Organisation();
		organisation.id = 1;
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', email: '', name: '', userName: '' }),
			[organisation],
		);
		const authVisitor = new ServicesActionAuthVisitor(service, CrudAction.Delete);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should not delete service by organisation admin for another organisation', () => {
		const organisation = new Organisation();
		organisation.id = 1;
		const service = new Service();
		service.organisationId = 2;
		service.id = 1;

		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', email: '', name: '', userName: '' }),
			[organisation],
		);
		const authVisitor = new ServicesActionAuthVisitor(service, CrudAction.Delete);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should not delete service by service admin', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[service],
		);
		const authVisitor = new ServicesActionAuthVisitor(service, CrudAction.Delete);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should not have authorisation to perform any action by service providers', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;
		const serviceProvider = ServiceProvider.create('', 1);

		const userGroup = new ServiceProviderAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			serviceProvider,
		);
		const authVisitorCreate = new ServicesActionAuthVisitor(service, CrudAction.Create);
		const authVisitorUpdate = new ServicesActionAuthVisitor(service, CrudAction.Update);
		const authVisitorDelete = new ServicesActionAuthVisitor(service, CrudAction.Delete);

		expect(authVisitorCreate.hasPermission([userGroup])).toBe(false);
		expect(authVisitorUpdate.hasPermission([userGroup])).toBe(false);
		expect(authVisitorDelete.hasPermission([userGroup])).toBe(false);
	});

	it('should not have authorisation to perform any action as anonymous user', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const groups = [new AnonymousAuthGroup(anonymous)];

		const authVisitorCreate = new ServicesActionAuthVisitor(service, CrudAction.Create);
		const authVisitorUpdate = new ServicesActionAuthVisitor(service, CrudAction.Update);
		const authVisitorDelete = new ServicesActionAuthVisitor(service, CrudAction.Delete);

		expect(authVisitorCreate.hasPermission(groups)).toBe(false);
		expect(authVisitorUpdate.hasPermission(groups)).toBe(false);
		expect(authVisitorDelete.hasPermission(groups)).toBe(false);
	});

	it('should not have authorisation to perform any action by citizens', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new CitizenAuthGroup(User.createSingPassUser('', ''));
		const authVisitorCreate = new ServicesActionAuthVisitor(service, CrudAction.Create);
		const authVisitorUpdate = new ServicesActionAuthVisitor(service, CrudAction.Update);
		const authVisitorDelete = new ServicesActionAuthVisitor(service, CrudAction.Delete);

		expect(authVisitorCreate.hasPermission([userGroup])).toBe(false);
		expect(authVisitorUpdate.hasPermission([userGroup])).toBe(false);
		expect(authVisitorDelete.hasPermission([userGroup])).toBe(false);
	});
});
