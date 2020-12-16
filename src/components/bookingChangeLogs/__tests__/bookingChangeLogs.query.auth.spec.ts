import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { Organisation, Service, ServiceProvider, User } from '../../../models';
import { BookingChangeLogsQueryAuthVisitor } from '../bookingChangeLogs.auth';
import * as uuid from 'uuid';

const adminMock = User.createAdminUser({
	molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
	userName: 'UserName',
	email: 'test@email.com',
	name: 'Name',
});

const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

const organisation = new Organisation();
organisation.id = 1;

const service = new Service();
service.id = 2;

const serviceProvider = new ServiceProvider();
serviceProvider.id = 10;

describe('BookingChangeLogs query auth tests', () => {
	it('should not allow anonymous user to view booking change logs', async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const anonymousGroup = [new AnonymousAuthGroup(anonymous)];
		const visitor = await new BookingChangeLogsQueryAuthVisitor(
			'changelog',
			'service',
			'booking',
		).createUserVisibilityCondition(anonymousGroup);

		expect(visitor.userCondition).toStrictEqual('FALSE');
		expect(visitor.userParams).toStrictEqual({});
	});

	it('should not allow citizen to view booking change logs', async () => {
		const citizens = [new CitizenAuthGroup(singpassMock)];
		const visitor = await new BookingChangeLogsQueryAuthVisitor(
			'changelog',
			'service',
			'booking',
		).createUserVisibilityCondition(citizens);

		expect(visitor.userCondition).toStrictEqual('FALSE');
		expect(visitor.userParams).toStrictEqual({});
	});

	it('should filter booking change logs by organisation id', async () => {
		const orgAdmins = [new OrganisationAdminAuthGroup(adminMock, [organisation])];
		const visitor = await new BookingChangeLogsQueryAuthVisitor(
			'changelog',
			'service',
			'booking',
		).createUserVisibilityCondition(orgAdmins);

		expect(visitor.userCondition).toStrictEqual('(service."_organisationId" IN (:...authorisedOrganisationIds))');
		expect(visitor.userParams).toStrictEqual({ authorisedOrganisationIds: [1] });
	});

	it('should filter booking change logs by service id', async () => {
		const serviceAdmins = [new ServiceAdminAuthGroup(adminMock, [service])];
		const visitor = await new BookingChangeLogsQueryAuthVisitor(
			'changelog',
			'service',
			'booking',
		).createUserVisibilityCondition(serviceAdmins);

		expect(visitor.userCondition).toStrictEqual('(changelog."_serviceId" IN (:...authorisedServiceIds))');
		expect(visitor.userParams).toStrictEqual({ authorisedServiceIds: [2] });
	});

	it('should filter booking change logs by service provider id', async () => {
		const serviceProviders = [new ServiceProviderAuthGroup(adminMock, serviceProvider)];
		const visitor = await new BookingChangeLogsQueryAuthVisitor(
			'changelog',
			'service',
			'booking',
		).createUserVisibilityCondition(serviceProviders);

		expect(visitor.userCondition).toStrictEqual('(booking."_serviceProviderId" = :authorisedServiceProviderId)');
		expect(visitor.userParams).toStrictEqual({ authorisedServiceProviderId: 10 });
	});

	it('should return FALSE query when user has no groups', async () => {
		const result = await new BookingChangeLogsQueryAuthVisitor(
			'changelog',
			'service',
			'booking',
		).createUserVisibilityCondition([]);

		expect(result.userCondition).toStrictEqual('FALSE');
		expect(result.userParams).toStrictEqual({});
	});
});
