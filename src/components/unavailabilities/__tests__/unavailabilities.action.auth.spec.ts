import { Organisation, Service, ServiceProvider, Unavailability, User } from '../../../models';
import { UnavailabilitiesActionAuthVisitor } from '../unavailabilities.auth';
import {
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

afterEach(() => {
	jest.resetAllMocks();
	jest.clearAllMocks();
});
// tslint:disable-next-line: no-big-function
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
		expect(() => new UnavailabilitiesActionAuthVisitor(unavailabilityMock).hasPermission(groups)).toThrow();
	});
	it('should validate FALSE for citizen action permission', async () => {
		const unavailabilityMock = new Unavailability();
		const serviceMock = new Service();
		serviceMock.id = 1;
		serviceMock.name = 'Test';
		unavailabilityMock.serviceId = 1;
		unavailabilityMock.service = serviceMock;
		const groups = [new CitizenAuthGroup(singpassMock)];

		expect(new UnavailabilitiesActionAuthVisitor(unavailabilityMock).hasPermission(groups)).toBe(false);
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

		expect(new UnavailabilitiesActionAuthVisitor(unavailabilityMock).hasPermission(groups)).toBe(true);
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

		expect(new UnavailabilitiesActionAuthVisitor(unavailabilityMock).hasPermission(groups)).toBe(false);
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

		expect(new UnavailabilitiesActionAuthVisitor(unavailabilityMock).hasPermission(groups)).toBe(true);
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

		expect(new UnavailabilitiesActionAuthVisitor(unavailabilityMock).hasPermission(groups)).toBe(false);
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

		expect(new UnavailabilitiesActionAuthVisitor(unavailabilityMock).hasPermission(groups)).toBe(true);
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

		expect(new UnavailabilitiesActionAuthVisitor(unavailabilityMock).hasPermission(groups)).toBe(false);
	});
});
