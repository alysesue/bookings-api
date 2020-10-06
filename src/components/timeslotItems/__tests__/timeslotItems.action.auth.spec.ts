import { BookingBuilder } from '../../../models/entities/booking';
import { Calendar, ChangeLogAction, Organisation, Service, ServiceProvider, User, TimeslotsSchedule } from '../../../models';
import { TimeslotItemsActionAuthVisitor } from '../timeslotItems.auth';
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

	it('should validate param to have service or service provider', async () => {
		const timeslotsScheduleMock = new TimeslotsSchedule();

		const groups = [new CitizenAuthGroup(singpassMock)];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toThrow();
	});
	it('should validate FALSE for citizen action permission', async () => {
		const serviceMock = new Service();
		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._service = serviceMock;

		const groups = [new CitizenAuthGroup(singpassMock)];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(false);
	});

	it('should validate FALSE for other organisation admin action permission', async () => {
		const serviceMock = new Service();
		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._service = serviceMock;
		const organisation = new Organisation();
		organisation.id = 3;

		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisation])];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(false);
	});

	it('should validate TRUE for the same organisation admin action permission', async () => {
		const serviceMock = new Service();
		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._service = serviceMock;
		const organisation = new Organisation();
		organisation.id = 2;

		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisation])];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(true);
	});

	it('should validate FALSE for other service admin action permission', async () => {
		const serviceMock = new Service();
		serviceMock.id = 1;
		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._service = serviceMock;

		const groups = [new ServiceAdminAuthGroup(adminMock, [service])];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(false);
	});

	it('should validate TRUE for other service admin action permission', async () => {
		const serviceMock = new Service();
		serviceMock.id = 3;
		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._service = serviceMock;

		const groups = [new ServiceAdminAuthGroup(adminMock, [service])];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(false);
	});

	it('should validate FALSE for other service provider timeslot by service admin action permission', async () => {
		const serviceMock = new Service();
		serviceMock.id = 10;
		const serviceProviderB = ServiceProvider.create('Peter', new Calendar(), serviceMock.id, 'test@email.com', '0000');

		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._serviceProvider = serviceProviderB;

		const groups = [new ServiceAdminAuthGroup(adminMock, [service])];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(false);
	});

	it('should validate FALSE for other service provider action permission', async () => {

		const serviceProviderA = ServiceProvider.create('Alice', new Calendar(), service.id, 'test@email.com', '0000');
		const serviceProviderB = ServiceProvider.create('Peter', new Calendar(), service.id, 'test@email.com', '0000');
		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._serviceProvider = serviceProviderB;

		const groups = [new ServiceProviderAuthGroup(adminMock, serviceProviderA)];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(false);
	});

	it('should validate TRUE for other service provider action permission', async () => {
		const serviceProvider = ServiceProvider.create('Peter', new Calendar(), service.id, 'test@email.com', '0000');
		const timeslotsScheduleMock = new TimeslotsSchedule();
		timeslotsScheduleMock._serviceProvider = serviceProvider;

		const groups = [new ServiceProviderAuthGroup(adminMock, serviceProvider)];

		expect(new TimeslotItemsActionAuthVisitor(timeslotsScheduleMock).hasPermission(groups)).toBe(true);

	});

});
