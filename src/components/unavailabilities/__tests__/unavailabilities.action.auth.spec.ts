import { Organisation, Service, ServiceProvider, Unavailability, User } from '../../../models';
import { UnavailabilitiesActionAuthVisitor } from '../unavailabilities.auth';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { CrudAction } from '../../../enums/crudAction';
import * as uuid from 'uuid';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

afterEach(() => {
	jest.resetAllMocks();
	jest.clearAllMocks();
});

// tslint:disable-next-line:no-big-function
describe('Unavailabilities action auth', () => {
	const organisation = new Organisation();
	organisation.id = 1;

	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	it('should validate param to have service', async () => {
		const unavailabilityMock = new Unavailability();
		const groups = [new CitizenAuthGroup(singpassMock)];
		expect(() =>
			new UnavailabilitiesActionAuthVisitor(unavailabilityMock, CrudAction.Create).hasPermission(groups),
		).toThrow();
	});

	it('should validate FALSE for anonymous user action permission', async () => {
		const unavailabilityMock = new Unavailability();
		const serviceMock = new Service();
		serviceMock.id = 1;
		serviceMock.name = 'Test';
		unavailabilityMock.serviceId = 1;
		unavailabilityMock.service = serviceMock;
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const groups = [new AnonymousAuthGroup(anonymous)];

		expect(new UnavailabilitiesActionAuthVisitor(unavailabilityMock, CrudAction.Create).hasPermission(groups)).toBe(
			false,
		);
	});

	it('should validate FALSE for citizen action permission', async () => {
		const unavailabilityMock = new Unavailability();
		const serviceMock = new Service();
		serviceMock.id = 1;
		serviceMock.name = 'Test';
		unavailabilityMock.serviceId = 1;
		unavailabilityMock.service = serviceMock;
		const groups = [new CitizenAuthGroup(singpassMock)];

		expect(new UnavailabilitiesActionAuthVisitor(unavailabilityMock, CrudAction.Create).hasPermission(groups)).toBe(
			false,
		);
	});

	it('should validate TRUE for the same organisation admin action permission', async () => {
		const unavailabilityMock = new Unavailability();
		const serviceMock = new Service();
		serviceMock.id = 1;
		serviceMock.name = 'Test';
		serviceMock.organisationId = organisation.id;
		unavailabilityMock.serviceId = 1;
		unavailabilityMock.service = serviceMock;
		const organisationMock = new Organisation();
		organisationMock.id = 1;

		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisationMock])];

		expect(new UnavailabilitiesActionAuthVisitor(unavailabilityMock, CrudAction.Create).hasPermission(groups)).toBe(
			true,
		);
	});

	it('should validate FALSE for different organisation admin action permission', async () => {
		const unavailabilityMock = new Unavailability();
		const serviceMock = new Service();
		serviceMock.id = 1;
		serviceMock.name = 'Test';
		serviceMock.organisationId = organisation.id;
		unavailabilityMock.serviceId = 1;
		unavailabilityMock.service = serviceMock;
		const organisationMock = new Organisation();
		organisationMock.id = 2;

		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisationMock])];

		expect(new UnavailabilitiesActionAuthVisitor(unavailabilityMock, CrudAction.Create).hasPermission(groups)).toBe(
			false,
		);
	});

	it('should validate TRUE in different service admin action permission', async () => {
		const authorisedService = new Service();
		authorisedService.id = 1;

		const unavailabilityMock = new Unavailability();
		const serviceMock = new Service();
		serviceMock.id = 1;
		unavailabilityMock.serviceId = 1;
		unavailabilityMock.service = serviceMock;

		const groups = [new ServiceAdminAuthGroup(adminMock, [authorisedService])];

		expect(new UnavailabilitiesActionAuthVisitor(unavailabilityMock, CrudAction.Create).hasPermission(groups)).toBe(
			true,
		);
	});

	it('should validate FALSE in different service admin action permission', async () => {
		const authorisedService = new Service();
		authorisedService.id = 2;

		const unavailabilityMock = new Unavailability();
		const serviceMock = new Service();
		serviceMock.id = 1;
		serviceMock.name = 'Test';
		unavailabilityMock.serviceId = 1;
		unavailabilityMock.service = serviceMock;

		const groups = [new ServiceAdminAuthGroup(adminMock, [authorisedService])];

		expect(new UnavailabilitiesActionAuthVisitor(unavailabilityMock, CrudAction.Create).hasPermission(groups)).toBe(
			false,
		);
	});
	it('should validate TRUE for the same service provider timeslot action permission', async () => {
		const service = new Service();
		service.id = 1;

		const serviceProviderA = ServiceProvider.create('Alice', service.id, 'test@email.com', '0000');
		serviceProviderA.id = 1;
		serviceProviderA.service = service;

		const unavailabilityMock = new Unavailability();
		unavailabilityMock.serviceId = 1;
		unavailabilityMock.service = service;
		unavailabilityMock.serviceProviders = [serviceProviderA];

		const groups = [new ServiceProviderAuthGroup(adminMock, serviceProviderA)];

		expect(new UnavailabilitiesActionAuthVisitor(unavailabilityMock, CrudAction.Create).hasPermission(groups)).toBe(
			true,
		);
	});

	it('should validate FALSE for the different service provider action permission', async () => {
		const service = new Service();
		service.id = 1;

		const serviceProviderA = ServiceProvider.create('Alice', service.id, 'test@email.com', '0000');
		serviceProviderA.id = 1;
		serviceProviderA.service = service;

		const serviceProviderB = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');
		serviceProviderB.id = 2;
		serviceProviderB.service = service;

		const unavailabilityMock = new Unavailability();
		unavailabilityMock.serviceId = 1;
		unavailabilityMock.service = service;
		unavailabilityMock.serviceProviders = [serviceProviderB];

		const groups = [new ServiceProviderAuthGroup(adminMock, serviceProviderA)];

		expect(new UnavailabilitiesActionAuthVisitor(unavailabilityMock, CrudAction.Create).hasPermission(groups)).toBe(
			false,
		);
	});

	it('should delete unavailability by organisation admin', () => {
		// tslint:disable-next-line:no-shadowed-variable
		const organisation1 = new Organisation();
		organisation1.id = 1;
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', email: '', name: '', userName: '' }),
			[organisation1],
		);

		const serviceProviderA = ServiceProvider.create('Alice', service.id, 'test@email.com', '0000');
		serviceProviderA.id = 1;
		serviceProviderA.service = service;

		const unavailabilityMock = new Unavailability();
		unavailabilityMock.serviceId = 1;
		unavailabilityMock.service = service;
		unavailabilityMock.serviceProviders = [serviceProviderA];

		const authVisitor = new UnavailabilitiesActionAuthVisitor(unavailabilityMock, CrudAction.Delete);
		authVisitor.visitOrganisationAdmin(userGroup);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should delete unavailability by service admin', () => {
		const organisation1 = new Organisation();
		organisation1.id = 1;
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', email: '', name: '', userName: '' }),
			[service],
		);

		const serviceProviderA = ServiceProvider.create('Alice', service.id, 'test@email.com', '0000');
		serviceProviderA.id = 1;
		serviceProviderA.service = service;

		const unavailabilityMock = new Unavailability();
		unavailabilityMock.serviceId = 1;
		unavailabilityMock.service = service;
		unavailabilityMock.serviceProviders = [serviceProviderA];

		const authVisitor = new UnavailabilitiesActionAuthVisitor(unavailabilityMock, CrudAction.Delete);
		authVisitor.visitServiceAdmin(userGroup);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should delete unavailability by service provider', () => {
		const organisation1 = new Organisation();
		organisation1.id = 1;
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const serviceProvider = ServiceProvider.create('Alice', service.id, 'test@email.com', '0000');
		serviceProvider.id = 1;
		serviceProvider.service = service;

		const userGroup = new ServiceProviderAuthGroup(
			User.createAdminUser({ molAdminId: '', email: '', name: '', userName: '' }),
			serviceProvider,
		);

		const unavailabilityMock = new Unavailability();
		unavailabilityMock.serviceId = 1;
		unavailabilityMock.service = service;
		unavailabilityMock.serviceProviders = [serviceProvider];

		const authVisitor = new UnavailabilitiesActionAuthVisitor(unavailabilityMock, CrudAction.Delete);
		authVisitor.visitServiceProvider(userGroup);

		expect(authVisitor.hasPermission([userGroup])).toBe(true);
	});

	it('should not have authorisation to perform any action by citizens', () => {
		const service = new Service();
		service.organisationId = 1;
		service.id = 1;

		const serviceProvider = ServiceProvider.create('Alice', service.id, 'test@email.com', '0000');
		serviceProvider.id = 1;
		serviceProvider.service = service;

		const userGroup = new CitizenAuthGroup(User.createSingPassUser('', ''));

		const unavailabilityMock = new Unavailability();
		unavailabilityMock.serviceId = 1;
		unavailabilityMock.service = service;
		unavailabilityMock.serviceProviders = [serviceProvider];

		const authVisitor = new UnavailabilitiesActionAuthVisitor(unavailabilityMock, CrudAction.Delete);
		authVisitor.visitCitizen(userGroup);

		expect(authVisitor.hasPermission([userGroup])).toBe(false);
	});
});
