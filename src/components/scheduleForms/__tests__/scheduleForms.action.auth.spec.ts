import { Organisation, Service, ServiceProvider, User } from '../../../models';
import { CrudAction } from '../../../enums/crudAction';
import {
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { ScheduleFormsActionAuthVisitor, ScheduleFormsQueryAuthVisitor } from '../scheduleForms.auth';
import { ServiceProvidersActionAuthVisitor } from '../../serviceProviders/serviceProviders.auth';

// tslint:disable-next-line:no-big-function
describe('Action scheduleForm Auth', () => {
	it('Should return error if no service provider', () => {
		expect(() => new ScheduleFormsActionAuthVisitor(undefined, CrudAction.Create)).toThrowError();
	});
	it('Should return error if no service with service provider', () => {
		expect(() => new ScheduleFormsActionAuthVisitor(new ServiceProvider(), CrudAction.Create)).toThrowError();
	});
	it('should be able to create/update/read only for serviceProvider', () => {
		const serviceProvider = ServiceProvider.create('provider', 1);
		serviceProvider.service = new Service();
		const userGroup = new ServiceProviderAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			serviceProvider,
		);

		let authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Create);
		expect(authVisitor.hasPermission([userGroup])).toBeTruthy();

		authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Read);
		expect(authVisitor.hasPermission([userGroup])).toBeTruthy();

		authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Update);
		expect(authVisitor.hasPermission([userGroup])).toBeTruthy();

		authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Delete);
		expect(authVisitor.hasPermission([userGroup])).toBeFalsy();
	});

	it('should be able to create/update/read only entity for service admin', () => {
		const service = new Service();
		service.id = 1;
		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[service],
		);
		const serviceProvider = ServiceProvider.create('new sp', 1);
		serviceProvider.service = service;

		let authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Create);
		expect(authVisitor.hasPermission([userGroup])).toBe(true);

		authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Update);
		expect(authVisitor.hasPermission([userGroup])).toBe(true);

		authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Read);
		expect(authVisitor.hasPermission([userGroup])).toBe(true);

		authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Delete);
		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should be able to create/update/read only entity for org admin', () => {
		const organisation = new Organisation();
		organisation.id = 1;
		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[organisation],
		);
		const serviceProvider = ServiceProvider.create('new sp', 1);
		serviceProvider.service = new Service();
		serviceProvider.service.organisationId = 1;

		let authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Create);
		expect(authVisitor.hasPermission([userGroup])).toBe(true);

		authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Update);
		expect(authVisitor.hasPermission([userGroup])).toBe(true);

		authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Read);
		expect(authVisitor.hasPermission([userGroup])).toBe(true);

		authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Delete);
		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it("shouldn't be able to create/update/read/dete  entity citizen", () => {
		const userGroup = new CitizenAuthGroup(User.createSingPassUser('23', '23'));
		const serviceProvider = ServiceProvider.create('new sp', 1);
		serviceProvider.service = new Service();

		let authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Create);
		expect(authVisitor.hasPermission([userGroup])).toBe(false);

		authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Update);
		expect(authVisitor.hasPermission([userGroup])).toBe(false);

		authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Read);
		expect(authVisitor.hasPermission([userGroup])).toBe(false);

		authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Delete);
		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should not be able to update an entity not belonging to authorised services for org admin', () => {
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

		const serviceProvider = ServiceProvider.create('new sp', serviceForServiceProvider.id);
		serviceProvider.service = serviceForServiceProvider;
		const authVisitor = new ScheduleFormsActionAuthVisitor(serviceProvider, CrudAction.Update);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});

	it('should not be able to update entity for service admin not being in the same service', () => {
		const service = new Service();
		service.id = 2;
		const serviceAdminAuthGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ userName: '', molAdminId: '', email: '', name: '' }),
			[service],
		);

		const serviceProvider = ServiceProvider.create('new sp', 1);
		serviceProvider.service = new Service();
		const authVisitor = new ServiceProvidersActionAuthVisitor(serviceProvider, CrudAction.Update);

		expect(authVisitor.hasPermission([serviceAdminAuthGroup])).toBe(false);
	});
});
