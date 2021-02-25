import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { Organisation, Service, ServiceProvider, User } from '../../../models';
import * as uuid from 'uuid';
import { OneOffTimeslotsQueryAuthVisitor } from '../oneOffTimeslots.auth';

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

describe('oneOffTimeslots query auth tests', () => {
	it('should not allow anonymous user to view oneOffTimeslots', async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const anonymousGroup = [new AnonymousAuthGroup(anonymous)];
		const visitor = await new OneOffTimeslotsQueryAuthVisitor('sp', 'spService').createUserVisibilityCondition(
			anonymousGroup,
		);

		expect(visitor.userCondition).toStrictEqual('FALSE');
		expect(visitor.userParams).toStrictEqual({});
	});

	it('should not allow citizen to view oneOffTimeslots', async () => {
		const citizens = [new CitizenAuthGroup(singpassMock)];
		const visitor = await new OneOffTimeslotsQueryAuthVisitor('sp', 'spService').createUserVisibilityCondition(
			citizens,
		);

		expect(visitor.userCondition).toStrictEqual('FALSE');
		expect(visitor.userParams).toStrictEqual({});
	});

	it('should filter oneOffTimeslots by organisation id', async () => {
		const orgAdmins = [new OrganisationAdminAuthGroup(adminMock, [organisation])];
		const visitor = await new OneOffTimeslotsQueryAuthVisitor('sp', 'spService').createUserVisibilityCondition(
			orgAdmins,
		);

		expect(visitor.userCondition).toStrictEqual('(spService._organisationId IN (:...authorisedOrganisationIds))');
		expect(visitor.userParams).toStrictEqual({ authorisedOrganisationIds: [1] });
	});

	it('should filter oneOffTimeslots by service id', async () => {
		const serviceAdmins = [new ServiceAdminAuthGroup(adminMock, [service])];
		const visitor = await new OneOffTimeslotsQueryAuthVisitor('sp', 'spService').createUserVisibilityCondition(
			serviceAdmins,
		);

		expect(visitor.userCondition).toStrictEqual('(spService._id IN (:...authorisedServiceIds))');
		expect(visitor.userParams).toStrictEqual({ authorisedServiceIds: [2] });
	});

	it('should filter oneOffTimeslots by service provider id', async () => {
		const serviceProviders = [new ServiceProviderAuthGroup(adminMock, serviceProvider)];
		const visitor = await new OneOffTimeslotsQueryAuthVisitor('sp', 'spService').createUserVisibilityCondition(
			serviceProviders,
		);

		expect(visitor.userCondition).toStrictEqual('(sp._id = :authorisedServiceProviderId)');
		expect(visitor.userParams).toStrictEqual({ authorisedServiceProviderId: 10 });
	});

	it('should return FALSE query when user has no groups', async () => {
		const result = await new OneOffTimeslotsQueryAuthVisitor('sp', 'spService').createUserVisibilityCondition([]);

		expect(result.userCondition).toStrictEqual('FALSE');
		expect(result.userParams).toStrictEqual({});
	});
});
