import { BookingUUIDInfo, Organisation, Service, ServiceProvider, User } from '../../../models';
import { BookingQueryAuthVisitor, BookingQueryVisitorFactory } from '../bookings.auth';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import * as uuid from 'uuid';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

// tslint:disable-next-line: no-big-function
describe('Bookings query auth', () => {
	const organisation = new Organisation();
	organisation.id = 2;

	const service = new Service();
	service.id = 3;
	service.name = 'service';
	service.organisationId = organisation.id;
	service.organisation = organisation;

	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	it('should return FALSE query when user has no groups', async () => {
		const result = await new BookingQueryAuthVisitor('b', 's', 'c').createUserVisibilityCondition([]);

		expect(result.userCondition).toStrictEqual('FALSE');
		expect(result.userParams).toStrictEqual({});
	});

	it('should return filter for anonymous user', async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const groups = [new AnonymousAuthGroup(anonymous)];

		const result = await new BookingQueryAuthVisitor('b', 's', 'c').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual('(c."_userId" = :userId)');
		expect(result.userParams).toStrictEqual({
			userId: undefined, // TODO : fix this
		});
	});

	it('should return filter for anonymous user (with booking info)', async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		const bookingInfo: BookingUUIDInfo = {
			bookingUUID: '81baeb3f-d930-4f48-9808-3ee4debc3d8a',
			bookingId: 1,
			serviceId: 2,
			organisationId: 3,
			serviceProviderId: 4,
		};

		const groups = [new AnonymousAuthGroup(anonymous, bookingInfo)];

		const result = await new BookingQueryAuthVisitor('b', 's', 'c').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual('(b."_uuid" = :authorisedBookingUUID)');
		expect(result.userParams).toStrictEqual({ authorisedBookingUUID: '81baeb3f-d930-4f48-9808-3ee4debc3d8a' });
	});

	it(`should filter by citizen's uinfin`, async () => {
		const groups = [new CitizenAuthGroup(singpassMock)];
		const result = await new BookingQueryAuthVisitor('b', 's', 'c').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual('(b."_citizenUinFin" = :authorisedUinFin)');
		expect(result.userParams).toStrictEqual({
			authorisedUinFin: 'ABC1234',
		});
	});

	it(`should filter by organisation id`, async () => {
		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisation])];
		const result = await new BookingQueryAuthVisitor('b', 's', 'c').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual('(s."_organisationId" IN (:...authorisedOrganisationIds))');
		expect(result.userParams).toStrictEqual({
			authorisedOrganisationIds: [2],
		});
	});

	it(`should filter by service id`, async () => {
		const groups = [new ServiceAdminAuthGroup(adminMock, [service])];
		const result = await new BookingQueryAuthVisitor('b', 's', 'c').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual('(b."_serviceId" IN (:...authorisedBookingServiceIds))');
		expect(result.userParams).toStrictEqual({
			authorisedBookingServiceIds: [3],
		});
	});

	it(`should filter by service provider id`, async () => {
		const serviceProvider = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');
		serviceProvider.id = 5;
		const groups = [new ServiceProviderAuthGroup(adminMock, serviceProvider)];
		const result = await new BookingQueryAuthVisitor('b', 's', 'c').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual('(b."_serviceProviderId" = :authorisedServiceProviderId)');
		expect(result.userParams).toStrictEqual({
			authorisedServiceProviderId: 5,
		});
	});

	it(`should combine user groups' permission (union)`, async () => {
		const serviceProvider = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');
		serviceProvider.id = 5;
		const groups = [
			new ServiceAdminAuthGroup(adminMock, [service]),
			new ServiceProviderAuthGroup(adminMock, serviceProvider),
		];
		const result = await new BookingQueryAuthVisitor('b', 's', 'c').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual(
			'((b."_serviceId" IN (:...authorisedBookingServiceIds)) OR (b."_serviceProviderId" = :authorisedServiceProviderId))',
		);
		expect(result.userParams).toStrictEqual({
			authorisedBookingServiceIds: [3],
			authorisedServiceProviderId: 5,
		});
	});
});

describe('No auth booking query visitor', () => {
	it('should query all bookings for service if bypass auth filter', async () => {
		const groups = [new CitizenAuthGroup(singpassMock)];
		const result = await BookingQueryVisitorFactory.getBookingQueryVisitor(true).createUserVisibilityCondition(
			groups,
		);

		expect(result.userCondition).toStrictEqual('');
	});
});
