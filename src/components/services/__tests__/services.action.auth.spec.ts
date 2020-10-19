import { Organisation, Service, ServiceProvider, User } from '../../../models';
import {
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { ServicesActionAuthVisitor } from '../services.auth';
import { CrudAction } from '../../../enums/crudAction';

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
		authVisitor.visitOrganisationAdmin(userGroup);

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
		authVisitor.visitOrganisationAdmin(userGroup);

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
		authVisitor.visitServiceAdmin(userGroup);

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
		authVisitor.visitOrganisationAdmin(userGroup);

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
		authVisitor.visitServiceAdmin(userGroup);

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
		authVisitor.visitOrganisationAdmin(userGroup);

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
		authVisitor.visitServiceAdmin(userGroup);

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
		authVisitor.visitOrganisationAdmin(userGroup);

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
		authVisitor.visitOrganisationAdmin(userGroup);

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
		authVisitor.visitServiceAdmin(userGroup);

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
		authVisitorCreate.visitServiceProvider(userGroup);
		const authVisitorUpdate = new ServicesActionAuthVisitor(service, CrudAction.Update);
		authVisitorCreate.visitServiceProvider(userGroup);
		const authVisitorDelete = new ServicesActionAuthVisitor(service, CrudAction.Delete);
		authVisitorDelete.visitServiceProvider(userGroup);

		expect(authVisitorCreate.hasPermission([userGroup])).toBe(false);
		expect(authVisitorUpdate.hasPermission([userGroup])).toBe(false);
		expect(authVisitorDelete.hasPermission([userGroup])).toBe(false);
	});

	it('should not have authorisation to perform any action by citizens', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new CitizenAuthGroup(User.createSingPassUser('', ''));
		const authVisitorCreate = new ServicesActionAuthVisitor(service, CrudAction.Create);
		authVisitorCreate.visitCitizen(userGroup);
		const authVisitorUpdate = new ServicesActionAuthVisitor(service, CrudAction.Update);
		authVisitorCreate.visitCitizen(userGroup);
		const authVisitorDelete = new ServicesActionAuthVisitor(service, CrudAction.Delete);
		authVisitorDelete.visitCitizen(userGroup);

		expect(authVisitorCreate.hasPermission([userGroup])).toBe(false);
		expect(authVisitorUpdate.hasPermission([userGroup])).toBe(false);
		expect(authVisitorDelete.hasPermission([userGroup])).toBe(false);
	});
});
