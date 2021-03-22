import { OneOffTimeslot, Organisation, Service, ServiceProvider, User } from '../../../models';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import * as uuid from 'uuid';
import { OneOffTimeslotsActionAuthVisitor } from '../oneOffTimeslots.auth';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

// tslint:disable-next-line: no-big-function
describe('OneOffTimeslots action auth', () => {
	const organisation = new Organisation();
	organisation.id = 2;

	const getOneOffTimeslotMock = () => {
		const timeslotMock = new OneOffTimeslot();
		timeslotMock.id = 20;

		const serviceMock = new Service();
		serviceMock.id = 30;
		serviceMock.organisation = organisation;
		serviceMock.organisationId = organisation.id;

		const serviceProviderMock = new ServiceProvider();
		serviceProviderMock.id = 40;
		serviceProviderMock.service = serviceMock;
		serviceProviderMock.serviceId = serviceMock.id;

		timeslotMock.serviceProvider = serviceProviderMock;
		timeslotMock.serviceProviderId = serviceProviderMock.id;
		return { timeslotMock, serviceMock, serviceProviderMock };
	};

	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	it('should validate param to have service provider', async () => {
		const groups = [new CitizenAuthGroup(singpassMock)];
		const timeslotMock = new OneOffTimeslot();
		expect(() => new OneOffTimeslotsActionAuthVisitor(timeslotMock).hasPermission(groups)).toThrow();
	});

	it('should validate param to have service for service provider', async () => {
		const groups = [new CitizenAuthGroup(singpassMock)];
		const timeslotMock = new OneOffTimeslot();
		timeslotMock.serviceProvider = new ServiceProvider();
		expect(() => new OneOffTimeslotsActionAuthVisitor(timeslotMock).hasPermission(groups)).toThrow();
	});

	it('should validate FALSE for anonymous user action permission', async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const groups = [new AnonymousAuthGroup(anonymous)];
		const { timeslotMock: timeslotMockA } = getOneOffTimeslotMock();
		expect(new OneOffTimeslotsActionAuthVisitor(timeslotMockA).hasPermission(groups)).toBe(false);
	});

	it('should validate FALSE for citizen action permission', async () => {
		const groups = [new CitizenAuthGroup(singpassMock)];
		const { timeslotMock: timeslotMockA } = getOneOffTimeslotMock();
		expect(new OneOffTimeslotsActionAuthVisitor(timeslotMockA).hasPermission(groups)).toBe(false);
	});

	it('should validate FALSE for serice in different organisation admin action permission', async () => {
		const organisationMock = new Organisation();
		organisationMock.id = 3;
		const { timeslotMock: timeslotMockA } = getOneOffTimeslotMock();
		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisationMock])];

		expect(new OneOffTimeslotsActionAuthVisitor(timeslotMockA).hasPermission(groups)).toBe(false);
	});

	it('should validate FALSE for SP in different organisation admin action permission', async () => {
		const serviceMock = new Service();
		serviceMock.id = 1;
		serviceMock.organisationId = 2;
		const spMock = ServiceProvider.create('Peter', serviceMock.id, 'test@email.com', '0000');
		spMock.service = serviceMock;

		const organisationMock = new Organisation();
		organisationMock.id = 3;
		const { timeslotMock: timeslotMockA } = getOneOffTimeslotMock();
		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisationMock])];

		expect(new OneOffTimeslotsActionAuthVisitor(timeslotMockA).hasPermission(groups)).toBe(false);
	});

	it('should validate TRUE for the same organisation admin action permission', async () => {
		const organisationMock = new Organisation();
		organisationMock.id = 2;
		const { timeslotMock: timeslotMockA } = getOneOffTimeslotMock();
		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisationMock])];

		expect(new OneOffTimeslotsActionAuthVisitor(timeslotMockA).hasPermission(groups)).toBe(true);
	});

	it('should validate FALSE for other service admin action permission', async () => {
		const authorisedService = new Service();
		authorisedService.id = 3;

		const { timeslotMock: timeslotMockA } = getOneOffTimeslotMock();
		const groups = [new ServiceAdminAuthGroup(adminMock, [authorisedService])];

		expect(new OneOffTimeslotsActionAuthVisitor(timeslotMockA).hasPermission(groups)).toBe(false);
	});

	it('should validate TRUE for same service admin action permission', async () => {
		const { timeslotMock: timeslotMockA, serviceMock } = getOneOffTimeslotMock();
		const groups = [new ServiceAdminAuthGroup(adminMock, [serviceMock])];

		expect(new OneOffTimeslotsActionAuthVisitor(timeslotMockA).hasPermission(groups)).toBe(true);
	});

	it('should validate FALSE for other service provider timeslot by service admin action permission', async () => {
		const serviceMock = new Service();
		serviceMock.id = 10;
		const { timeslotMock: timeslotMockA } = getOneOffTimeslotMock();
		const groups = [new ServiceAdminAuthGroup(adminMock, [serviceMock])];

		expect(new OneOffTimeslotsActionAuthVisitor(timeslotMockA).hasPermission(groups)).toBe(false);
	});

	it('should validate FALSE for other service provider action permission', async () => {
		const serviceMock = new Service();
		serviceMock.id = 10;
		const serviceProviderB = ServiceProvider.create('Peter', serviceMock.id, 'test@email.com', '0000');
		serviceProviderB.service = serviceMock;
		const { timeslotMock: timeslotMockA } = getOneOffTimeslotMock();

		const groups = [new ServiceProviderAuthGroup(adminMock, serviceProviderB)];

		expect(new OneOffTimeslotsActionAuthVisitor(timeslotMockA).hasPermission(groups)).toBe(false);
	});

	it('should validate TRUE for same service provider action permission', async () => {
		const { timeslotMock: timeslotMockA, serviceProviderMock } = getOneOffTimeslotMock();

		const groups = [new ServiceProviderAuthGroup(adminMock, serviceProviderMock)];

		expect(new OneOffTimeslotsActionAuthVisitor(timeslotMockA).hasPermission(groups)).toBe(true);
	});
});
