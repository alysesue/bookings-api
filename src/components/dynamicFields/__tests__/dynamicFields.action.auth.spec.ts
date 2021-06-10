import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { Organisation, Service, ServiceProvider, User } from '../../../models';
import { DynamicFieldsActionAuthVisitor } from '../dynamicFields.auth';
import { VisitorCrudAction } from '../../../enums/crudAction';
import * as uuid from 'uuid';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

// tslint:disable-next-line: no-big-function
describe('DynamicFields action auth', () => {
	const organisation = new Organisation();
	organisation.id = 2;

	const service = new Service();
	service.id = 3;
	service.name = 'service';
	service.organisationId = organisation.id;
	service.organisation = organisation;

	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	it('should validate required parameters', async () => {
		expect(() => new DynamicFieldsActionAuthVisitor(undefined, VisitorCrudAction.Create)).toThrowError();
		expect(() => new DynamicFieldsActionAuthVisitor(null, VisitorCrudAction.Create)).toThrowError();
		expect(() => new DynamicFieldsActionAuthVisitor(service, null)).toThrowError();
		expect(() => new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Create)).not.toThrowError();
		expect(() => new DynamicFieldsActionAuthVisitor(service, undefined)).toThrowError();
	});

	it('should validate anonymous user action permission - when service allows anonymous booking', async () => {
		const serviceA = new Service();
		serviceA.id = 2;
		serviceA.name = 'service';
		serviceA.allowAnonymousBookings = true; // This still shouldn't allow editing.

		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const groups = [new AnonymousAuthGroup(anonymous)];

		expect(new DynamicFieldsActionAuthVisitor(serviceA, VisitorCrudAction.Create).hasPermission(groups)).toBe(
			false,
		);
		expect(new DynamicFieldsActionAuthVisitor(serviceA, VisitorCrudAction.Update).hasPermission(groups)).toBe(
			false,
		);
		expect(new DynamicFieldsActionAuthVisitor(serviceA, VisitorCrudAction.Delete).hasPermission(groups)).toBe(
			false,
		);
	});

	it('should validate anonymous user action permission - when service DOES NOT allow anonymous booking', async () => {
		const serviceA = new Service();
		serviceA.id = 2;
		serviceA.name = 'service';
		serviceA.allowAnonymousBookings = false;

		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const groups = [new AnonymousAuthGroup(anonymous)];

		expect(new DynamicFieldsActionAuthVisitor(serviceA, VisitorCrudAction.Create).hasPermission(groups)).toBe(
			false,
		);
		expect(new DynamicFieldsActionAuthVisitor(serviceA, VisitorCrudAction.Update).hasPermission(groups)).toBe(
			false,
		);
		expect(new DynamicFieldsActionAuthVisitor(serviceA, VisitorCrudAction.Delete).hasPermission(groups)).toBe(
			false,
		);
	});

	it('should validate citizen action permission', async () => {
		const groups = [new CitizenAuthGroup(singpassMock)];

		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Create).hasPermission(groups)).toBe(false);
		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Update).hasPermission(groups)).toBe(false);
		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Delete).hasPermission(groups)).toBe(false);
	});

	it('should validate organisation admin action permission', async () => {
		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisation])];

		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Create).hasPermission(groups)).toBe(true);
		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Update).hasPermission(groups)).toBe(true);
		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Delete).hasPermission(groups)).toBe(true);
	});

	it('should reject organisation admin permission for a different organisation', async () => {
		const organisationB = new Organisation();
		organisationB.id = 3;

		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisationB])];

		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Create).hasPermission(groups)).toBe(false);
		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Update).hasPermission(groups)).toBe(false);
		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Delete).hasPermission(groups)).toBe(false);
	});

	it('should validate service admin action permission', async () => {
		const groups = [new ServiceAdminAuthGroup(adminMock, [service])];

		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Create).hasPermission(groups)).toBe(true);
		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Update).hasPermission(groups)).toBe(true);
		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Delete).hasPermission(groups)).toBe(true);
	});

	it('should reject service admin permission for a different service', async () => {
		const serviceB = new Service();
		serviceB.id = 4;

		const groups = [new ServiceAdminAuthGroup(adminMock, [serviceB])];

		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Create).hasPermission(groups)).toBe(false);
		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Update).hasPermission(groups)).toBe(false);
		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Delete).hasPermission(groups)).toBe(false);
	});

	it('should validate service provider action permission', async () => {
		const serviceProvider = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');
		serviceProvider.id = 10;

		const groups = [new ServiceProviderAuthGroup(adminMock, serviceProvider)];

		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Create).hasPermission(groups)).toBe(false);
		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Update).hasPermission(groups)).toBe(false);
		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Delete).hasPermission(groups)).toBe(false);
	});

	it('should validate multiple groups', async () => {
		const serviceProviderA = ServiceProvider.create('Jhon', service.id, 'test@email.com', '0000');
		serviceProviderA.id = 11;

		const groups = [
			new ServiceProviderAuthGroup(adminMock, serviceProviderA),
			new ServiceAdminAuthGroup(adminMock, [service]),
		];

		expect(new DynamicFieldsActionAuthVisitor(service, VisitorCrudAction.Update).hasPermission(groups)).toBe(true);
	});
});
