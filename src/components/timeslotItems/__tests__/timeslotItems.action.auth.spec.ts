import { Organisation, Service, ServiceProvider, TimeslotsSchedule, User } from '../../../models';
import { TimeslotItemsActionAuthVisitor, TimeslotItemsAuthQueryVisitor } from '../timeslotItems.auth';
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

// tslint:disable-next-line: no-big-function
describe('TimeslotItems action auth', () => {
	const organisation = new Organisation();
	organisation.id = 2;

	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	it('should validate param to have service or service provider', async () => {
		const timeslotsScheduleMock = new TimeslotsSchedule();
		const groups = [new CitizenAuthGroup(singpassMock)];
		expect(() => new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toThrow();
	});
	it('should validate FALSE for citizen action permission', async () => {
		const serviceMock = new Service();
		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._service = serviceMock;
		const groups = [new CitizenAuthGroup(singpassMock)];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(false);
	});

	it('should validate FALSE for serice in different organisation admin action permission', async () => {
		const serviceMock = new Service();
		serviceMock.organisationId = 2;
		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._service = serviceMock;
		const organisationMock = new Organisation();
		organisationMock.id = 3;

		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisationMock])];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(false);
	});

	it('should validate FALSE for SP in different organisation admin action permission', async () => {
		const serviceMock = new Service();
		serviceMock.id = 1;
		serviceMock.organisationId = 2;
		const spMock = ServiceProvider.create('Peter', serviceMock.id, 'test@email.com', '0000');
		spMock.service = serviceMock;

		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._serviceProvider = spMock;
		const organisationMock = new Organisation();
		organisationMock.id = 3;

		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisationMock])];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(false);
	});

	it('should validate TRUE for the same organisation admin action permission', async () => {
		const serviceMock = new Service();
		serviceMock.organisationId = 2;
		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._service = serviceMock;
		const organisationMock = new Organisation();
		organisationMock.id = 2;

		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisationMock])];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(true);
	});

	it('should validate FALSE for other service admin action permission', async () => {
		const authorisedService = new Service();
		authorisedService.id = 3;

		const serviceMock = new Service();
		serviceMock.id = 1;
		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._service = serviceMock;

		const groups = [new ServiceAdminAuthGroup(adminMock, [authorisedService])];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(false);
	});

	it('should validate TRUE for other service admin action permission', async () => {
		const authorisedService = new Service();
		authorisedService.id = 3;

		const serviceMock = new Service();
		serviceMock.id = 3;
		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._service = serviceMock;

		const groups = [new ServiceAdminAuthGroup(adminMock, [authorisedService])];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(true);
	});

	it('should validate FALSE for other service provider timeslot by service admin action permission', async () => {
		const authorisedService = new Service();
		authorisedService.id = 3;

		const serviceMock = new Service();
		serviceMock.id = 10;
		const serviceProviderB = ServiceProvider.create('Peter', serviceMock.id, 'test@email.com', '0000');
		serviceProviderB.service = serviceMock;

		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._serviceProvider = serviceProviderB;

		const groups = [new ServiceAdminAuthGroup(adminMock, [authorisedService])];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(false);
	});

	it('should validate FALSE for other service provider action permission', async () => {
		const service = new Service();
		service.id = 3;

		const serviceProviderA = ServiceProvider.create('Alice', service.id, 'test@email.com', '0000');
		serviceProviderA.id = 1;
		serviceProviderA.service = service;
		const serviceProviderB = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');
		serviceProviderB.id = 2;
		serviceProviderB.service = service;
		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._serviceProvider = serviceProviderB;

		const groups = [new ServiceProviderAuthGroup(adminMock, serviceProviderA)];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(false);
	});

	it('should validate TRUE for other service provider action permission', async () => {
		const service = new Service();
		service.id = 3;

		const serviceProvider = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');
		serviceProvider.id = 1;
		serviceProvider.service = service;
		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._serviceProvider = serviceProvider;

		const groups = [new ServiceProviderAuthGroup(adminMock, serviceProvider)];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(true);
	});
});

describe('timeslotSchedule auth query tests', () => {
	it('should return timeslotSchedule for org admin', () => {
		const organisation = new Organisation();
		const userGroup = new OrganisationAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[organisation],
		);

		const auth = new TimeslotItemsAuthQueryVisitor('s', 'sp');

		console.log(auth.createUserVisibilityCondition([userGroup]))
	});

	it('should ', () => {
		const service = new Service();
		const userGroup = new ServiceAdminAuthGroup(
			User.createAdminUser({ molAdminId: '', userName: '', email: '', name: '' }),
			[service],
		);

		const auth = new TimeslotItemsAuthQueryVisitor('s', 'sp');

		console.log(auth.createUserVisibilityCondition([userGroup]))
	});
});
