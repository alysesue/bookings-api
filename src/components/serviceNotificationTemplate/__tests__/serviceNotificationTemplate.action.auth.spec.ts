import { Organisation, Service, ServiceProvider, User } from '../../../models';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { NotificationTemplateActionAuthVisitor } from '../serviceNotificationTemplate.auth';
import { CrudAction } from '../../../enums/crudAction';
import * as uuid from 'uuid';

// tslint:disable-next-line: no-big-function
describe('Services Notification Template auth tests - action', () => {
	it('should create a service template as organisation admin', () => {
		const organisation = new Organisation();
		organisation.id = 1;
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', email: '', name: '', userName: '' }),
			[organisation],
		);
		const authVisitor = new NotificationTemplateActionAuthVisitor(service, CrudAction.Create);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should not create a service template as organisation admin for another organisation', () => {
		const organisation = new Organisation();
		organisation.id = 1;
		const service = new Service();
		service.organisationId = 2;
		service.id = 1;

		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', email: '', name: '', userName: '' }),
			[organisation],
		);
		const authVisitor = new NotificationTemplateActionAuthVisitor(service, CrudAction.Create);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should not create a service template as service admin', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[service],
		);
		const authVisitor = new NotificationTemplateActionAuthVisitor(service, CrudAction.Read);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should update service template as organisation admin', () => {
		const organisation = new Organisation();
		organisation.id = 1;
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', email: '', name: '', userName: '' }),
			[organisation],
		);
		const authVisitor = new NotificationTemplateActionAuthVisitor(service, CrudAction.Update);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should create a service template as service admin', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[service],
		);
		const authVisitor = new NotificationTemplateActionAuthVisitor(service, CrudAction.Create);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should update service template as service admin', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[service],
		);
		const authVisitor = new NotificationTemplateActionAuthVisitor(service, CrudAction.Update);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should not update service template as organisation admin for another organisation', () => {
		const organisation = new Organisation();
		organisation.id = 1;
		const service = new Service();
		service.organisationId = 2;
		service.id = 1;

		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', email: '', name: '', userName: '' }),
			[organisation],
		);
		const authVisitor = new NotificationTemplateActionAuthVisitor(service, CrudAction.Update);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should not update service template as service admin for another service', () => {
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
		const authVisitor = new NotificationTemplateActionAuthVisitor(serviceOfServiceAdmin, CrudAction.Update);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should delete service template as organisation admin', () => {
		const organisation = new Organisation();
		organisation.id = 1;
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', email: '', name: '', userName: '' }),
			[organisation],
		);
		const authVisitor = new NotificationTemplateActionAuthVisitor(service, CrudAction.Delete);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should not delete service template as organisation admin for another organisation', () => {
		const organisation = new Organisation();
		organisation.id = 1;
		const service = new Service();
		service.organisationId = 2;
		service.id = 1;

		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', email: '', name: '', userName: '' }),
			[organisation],
		);
		const authVisitor = new NotificationTemplateActionAuthVisitor(service, CrudAction.Delete);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should not delete service template as service admin', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[service],
		);
		const authVisitor = new NotificationTemplateActionAuthVisitor(service, CrudAction.Delete);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should not have authorisation to perform any action as service providers', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;
		const serviceProvider = ServiceProvider.create('', 1);

		const userGroup = new ServiceProviderAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			serviceProvider,
		);

		expect(new NotificationTemplateActionAuthVisitor(service, CrudAction.Create).hasPermission([userGroup])).toBe(
			false,
		);
		expect(new NotificationTemplateActionAuthVisitor(service, CrudAction.Update).hasPermission([userGroup])).toBe(
			false,
		);
		expect(new NotificationTemplateActionAuthVisitor(service, CrudAction.Delete).hasPermission([userGroup])).toBe(
			false,
		);
	});

	it('should not have authorisation to perform any action as anonymous user', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const groups = [new AnonymousAuthGroup(anonymous)];

		expect(new NotificationTemplateActionAuthVisitor(service, CrudAction.Create).hasPermission(groups)).toBe(false);
		expect(new NotificationTemplateActionAuthVisitor(service, CrudAction.Update).hasPermission(groups)).toBe(false);
		expect(new NotificationTemplateActionAuthVisitor(service, CrudAction.Delete).hasPermission(groups)).toBe(false);
	});

	it('should not have authorisation to perform any action as citizens', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new CitizenAuthGroup(User.createSingPassUser('', ''));

		expect(new NotificationTemplateActionAuthVisitor(service, CrudAction.Create).hasPermission([userGroup])).toBe(
			false,
		);
		expect(new NotificationTemplateActionAuthVisitor(service, CrudAction.Update).hasPermission([userGroup])).toBe(
			false,
		);
		expect(new NotificationTemplateActionAuthVisitor(service, CrudAction.Delete).hasPermission([userGroup])).toBe(
			false,
		);
	});

	it('should throw error when trying to commit any action without service.organisationId', () => {
		const service = new Service();
		service.id = 1;

		const authVisitor = () => new NotificationTemplateActionAuthVisitor(service, CrudAction.Read);
		expect(authVisitor).toThrowErrorMatchingInlineSnapshot(
			'"NotificationTemplateActionAuthVisitor - Organisation ID cannot be null or undefined"',
		);
	});
});
