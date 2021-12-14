import { BookingStatus, BookingUUIDInfo, Organisation, Service, ServiceProvider, User } from '../../../models';
import { BookingQueryAuthVisitor, BookingQueryVisitorFactory } from '../bookings.auth';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	OtpAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import * as uuid from 'uuid';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
singpassMock.id = 123;

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
		const result = await new BookingQueryAuthVisitor('b', 's').createUserVisibilityCondition([]);

		expect(result.userCondition).toStrictEqual('FALSE');
		expect(result.userParams).toStrictEqual({});
	});

	it('should return filter for otp user', async () => {
		const otp = User.createOtpUser('+658400000');
		otp.id = 3;
		const groups = [new OtpAuthGroup(otp)];

		const result = await new BookingQueryAuthVisitor('b', 's').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual('((b."_ownerId" = :otpUserId))');
		expect(result.userParams).toStrictEqual({
			otpUserId: 3,
		});
	});

	// TO REVIEW
	xit('should return filter for anonymous user', async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		anonymous.id = 3;
		const groups = [new AnonymousAuthGroup(anonymous)];

		const result = await new BookingQueryAuthVisitor('b', 's').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual('((b."_creatorId" = :anonUserId))');
		expect(result.userParams).toStrictEqual({
			anonUserId: 3,
		});
	});

	// TO REVIEW
	xit('should return filter for anonymous user (with booking info)', async () => {
		const anonymous = User.createAnonymousUser({ createdAt: new Date(), trackingId: uuid.v4() });
		anonymous.id = 3;
		const bookingInfo: BookingUUIDInfo = {
			bookingUUID: '81baeb3f-d930-4f48-9808-3ee4debc3d8a',
			bookingId: 1,
			serviceId: 2,
			organisationId: 3,
			serviceProviderId: 4,
		};

		const groups = [new AnonymousAuthGroup(anonymous, bookingInfo)];

		const result = await new BookingQueryAuthVisitor('b', 's').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual(
			'((b."_creatorId" = :anonUserId) OR (b."_uuid" = :authorisedBookingUUID))',
		);
		expect(result.userParams).toStrictEqual({
			anonUserId: 3,
			authorisedBookingUUID: '81baeb3f-d930-4f48-9808-3ee4debc3d8a',
		});
	});

	it(`should filter by citizen's uinfin`, async () => {
		const groups = [new CitizenAuthGroup(singpassMock)];
		const result = await new BookingQueryAuthVisitor('b', 's').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual(
			'(b."_citizenUinFin" = :authorisedUinFin AND b."_ownerId" = :userId)',
		);
		expect(result.userParams).toStrictEqual({
			authorisedUinFin: 'ABC1234',
			userId: 123,
		});
	});

	it(`should filter by organisation id`, async () => {
		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisation])];
		const result = await new BookingQueryAuthVisitor('b', 's').createUserVisibilityCondition(groups);

		expect(result.userCondition).toStrictEqual('(s."_organisationId" IN (:...authorisedOrganisationIds))');
		expect(result.userParams).toStrictEqual({
			authorisedOrganisationIds: [2],
		});
	});

	describe('service admin auth', () => {
		it(`should filter by service ids`, async () => {
			const groups = [new ServiceAdminAuthGroup(adminMock, [service])];
			const result = await new BookingQueryAuthVisitor('b', 's').createUserVisibilityCondition(groups);

			expect(result.userCondition).toStrictEqual('(b."_serviceId" IN (:...authorisedBookingServiceIds))');
			expect(result.userParams).toStrictEqual({
				authorisedBookingServiceIds: [3],
			});
		});
	});

	describe('service provider auth', () => {
		it(`should filter by service provider id and booking status`, async () => {
			const serviceProvider = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');
			serviceProvider.id = 5;
			const groups = [new ServiceProviderAuthGroup(adminMock, serviceProvider)];
			const result = await new BookingQueryAuthVisitor('b', 's').createUserVisibilityCondition(groups);

			expect(result.userCondition).toStrictEqual(
				'(b."_serviceProviderId" = :authorisedServiceProviderId AND NOT b."_status" = :bookingStatus)',
			);
			expect(result.userParams).toStrictEqual({
				authorisedServiceProviderId: 5,
				bookingStatus: BookingStatus.PendingApprovalSA,
			});
		});
	});

	describe('service admin & service provider combined auth', () => {
		it(`should combine user groups' permission (union)`, async () => {
			const serviceProvider = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');
			serviceProvider.id = 5;
			const groups = [
				new ServiceAdminAuthGroup(adminMock, [service]),
				new ServiceProviderAuthGroup(adminMock, serviceProvider),
			];
			const result = await new BookingQueryAuthVisitor('b', 's').createUserVisibilityCondition(groups);

			expect(result.userCondition).toStrictEqual(
				'((b."_serviceId" IN (:...authorisedBookingServiceIds)) OR (b."_serviceProviderId" = :authorisedServiceProviderId AND NOT b."_status" = :bookingStatus))',
			);
			expect(result.userParams).toStrictEqual({
				authorisedBookingServiceIds: [3],
				authorisedServiceProviderId: 5,
				bookingStatus: BookingStatus.PendingApprovalSA,
			});
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
