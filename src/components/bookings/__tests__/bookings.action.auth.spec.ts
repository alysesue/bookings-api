import { BookingBuilder } from '../../../models/entities/booking';
import { BookingStatus, ChangeLogAction, Organisation, Service, ServiceProvider, User } from '../../../models';
import { BookingActionAuthVisitor } from '../bookings.auth';
import {
	AnonymousAuthGroup,
	CitizenAuthGroup,
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import * as uuid from 'uuid';
import { CitizenAuthenticationType } from '../../../models/citizenAuthenticationType';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

// tslint:disable-next-line: no-big-function
describe('Bookings action auth', () => {
	const organisation = new Organisation();
	organisation.id = 2;

	const service = Service.create('service', organisation);
	service.id = 3;
	service.name = 'service';

	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	it('should validate required parameters', async () => {
		const booking = new BookingBuilder()
			.withServiceId(service.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		expect(() => new BookingActionAuthVisitor(undefined, ChangeLogAction.Accept)).toThrowError();
		expect(() => new BookingActionAuthVisitor(null, ChangeLogAction.Accept)).toThrowError();
		expect(() => new BookingActionAuthVisitor(booking, undefined)).toThrowError();
		expect(() => new BookingActionAuthVisitor(booking, null)).toThrowError();
	});

	it('should validate anonymous user action permission - without otp', async () => {
		const serviceA = Service.create('service', organisation);
		serviceA.id = 2;

		const booking = new BookingBuilder()
			.withServiceId(serviceA.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		booking.service = serviceA;

		const onHoldBooking = new BookingBuilder()
			.withServiceId(serviceA.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		onHoldBooking.service = serviceA;
		onHoldBooking.status = BookingStatus.OnHold;

		const bookingUUID = uuid.v4();
		const anonymous = User.createAnonymousUser({
			createdAt: new Date(),
			trackingId: uuid.v4(),
			booking: bookingUUID,
		});
		const groups = [new AnonymousAuthGroup(anonymous)];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Create).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Cancel).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reschedule).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Accept).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reject).hasPermission(groups)).toBe(false);

		expect(new BookingActionAuthVisitor(onHoldBooking, ChangeLogAction.Create).hasPermission(groups)).toBe(true);
	});

	it('should validate anonymous user action permission - otp verified and service NOT setup', async () => {
		const serviceA = Service.create('service', organisation);
		serviceA.id = 2;

		const booking = new BookingBuilder()
			.withServiceId(serviceA.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		booking.service = serviceA;

		const onHoldBooking = new BookingBuilder()
			.withServiceId(serviceA.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		onHoldBooking.status = BookingStatus.OnHold;
		onHoldBooking.service = serviceA;

		const bookingUUID = uuid.v4();
		const anonymous = User.createAnonymousUser({
			createdAt: new Date(),
			trackingId: uuid.v4(),
			booking: bookingUUID,
		});
		const groups = [new AnonymousAuthGroup(anonymous, undefined, { mobileNo: '+6584000000' })];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Create).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Cancel).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reschedule).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Accept).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reject).hasPermission(groups)).toBe(false);

		expect(new BookingActionAuthVisitor(onHoldBooking, ChangeLogAction.Create).hasPermission(groups)).toBe(true);
	});

	it('should validate anonymous user action permission - otp verified and service setup', async () => {
		const serviceA = Service.create('service', organisation);
		serviceA.id = 2;
		serviceA.citizenAuthentication = [CitizenAuthenticationType.Singpass, CitizenAuthenticationType.Otp];

		const booking = new BookingBuilder()
			.withServiceId(serviceA.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		booking.service = serviceA;

		const onHoldBooking = new BookingBuilder()
			.withServiceId(serviceA.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();
		onHoldBooking.status = BookingStatus.OnHold;
		onHoldBooking.service = serviceA;

		const bookingUUID = uuid.v4();
		const anonymous = User.createAnonymousUser({
			createdAt: new Date(),
			trackingId: uuid.v4(),
			booking: bookingUUID,
		});
		const groups = [new AnonymousAuthGroup(anonymous, undefined, { mobileNo: '+6584000000' })];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Create).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Cancel).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reschedule).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Accept).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reject).hasPermission(groups)).toBe(false);

		expect(new BookingActionAuthVisitor(onHoldBooking, ChangeLogAction.Create).hasPermission(groups)).toBe(true);
	});

	it('should validate anonymous user reschedule, cancel and update action if user has a valid booking uuid (without otp)', async () => {
		const serviceA = Service.create('service', organisation);
		const bookingUUID = uuid.v4();
		serviceA.id = 4;

		const booking = new BookingBuilder()
			.withServiceId(serviceA.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-02T01:00:00'))
			.withEndDateTime(new Date('2020-10-02T02:00:00'))
			.build();
		booking.id = 10;
		booking.service = serviceA;
		booking.uuid = bookingUUID;

		const anonymous = User.createAnonymousUser({
			createdAt: new Date(),
			trackingId: uuid.v4(),
			booking: bookingUUID,
		});
		const groups = [
			new AnonymousAuthGroup(anonymous, {
				bookingUUID,
				bookingId: booking.id,
				organisationId: 1,
				serviceId: serviceA.id,
			}),
		];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Cancel).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reschedule).hasPermission(groups)).toBe(false);

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Accept).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reject).hasPermission(groups)).toBe(false);
	});

	it('should validate anonymous user reschedule, cancel and update action if user has a valid booking uuid (otp verified)', async () => {
		const serviceA = Service.create('service', organisation);
		const bookingUUID = uuid.v4();
		serviceA.id = 4;
		serviceA.name = 'service';

		const booking = new BookingBuilder()
			.withServiceId(serviceA.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-02T01:00:00'))
			.withEndDateTime(new Date('2020-10-02T02:00:00'))
			.build();
		booking.id = 10;
		booking.service = serviceA;
		booking.uuid = bookingUUID;

		const anonymous = User.createAnonymousUser({
			createdAt: new Date(),
			trackingId: uuid.v4(),
			booking: bookingUUID,
		});
		const groups = [
			new AnonymousAuthGroup(
				anonymous,
				{
					bookingUUID,
					bookingId: booking.id,
					organisationId: 1,
					serviceId: serviceA.id,
				},
				{ mobileNo: '+6584000000' },
			),
		];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Cancel).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reschedule).hasPermission(groups)).toBe(true);

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Accept).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reject).hasPermission(groups)).toBe(false);
	});

	it('should validate anonymous user reschedule, cancel and update action - should not allow user to edit any other booking other than his own valid uuid', async () => {
		const serviceA = Service.create('service', organisation);
		const bookingUUID = uuid.v4();
		serviceA.id = 4;
		serviceA.name = 'service';

		const booking = new BookingBuilder()
			.withServiceId(serviceA.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-02T01:00:00'))
			.withEndDateTime(new Date('2020-10-02T02:00:00'))
			.build();

		booking.service = serviceA;
		booking.uuid = bookingUUID;

		const anonymous = User.createAnonymousUser({
			createdAt: new Date(),
			trackingId: uuid.v4(),
			booking: uuid.v4(),
		});
		const groups = [new AnonymousAuthGroup(anonymous)];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Create).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Cancel).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reschedule).hasPermission(groups)).toBe(false);

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Accept).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reject).hasPermission(groups)).toBe(false);
	});

	it('should validate citizen action permission', async () => {
		const booking = new BookingBuilder()
			.withServiceId(service.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		booking.service = service;

		const groups = [new CitizenAuthGroup(singpassMock)];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Create).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Cancel).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reschedule).hasPermission(groups)).toBe(true);

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Accept).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reject).hasPermission(groups)).toBe(false);
	});

	it('should validate citizen action permission - singpass NOT set up', async () => {
		const serviceA = Service.create('service', organisation);
		serviceA.citizenAuthentication = [CitizenAuthenticationType.Otp];

		const booking = new BookingBuilder()
			.withServiceId(service.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		booking.service = serviceA;

		const groups = [new CitizenAuthGroup(singpassMock)];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Create).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Cancel).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reschedule).hasPermission(groups)).toBe(false);

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Accept).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reject).hasPermission(groups)).toBe(false);
	});

	it('should reject citizen permission for a different uinfin', async () => {
		const booking = new BookingBuilder()
			.withServiceId(service.id)
			.withCitizenUinFin('AA0')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		booking.service = service;

		const groups = [new CitizenAuthGroup(singpassMock)];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Create).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Cancel).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reschedule).hasPermission(groups)).toBe(false);

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Accept).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reject).hasPermission(groups)).toBe(false);
	});

	it('should validate organisation admin action permission', async () => {
		const booking = new BookingBuilder()
			.withServiceId(service.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		booking.service = service;

		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisation])];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Create).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Cancel).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reschedule).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Accept).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reject).hasPermission(groups)).toBe(true);
	});

	it('should reject organisation admin permission for a different organisation', async () => {
		const booking = new BookingBuilder()
			.withServiceId(service.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		booking.service = service;

		const organisationB = new Organisation();
		organisationB.id = 3;

		const groups = [new OrganisationAdminAuthGroup(adminMock, [organisationB])];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Create).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Cancel).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reschedule).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Accept).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reject).hasPermission(groups)).toBe(false);
	});

	it('should validate service admin action permission', async () => {
		const booking = new BookingBuilder()
			.withServiceId(service.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		booking.service = service;

		const groups = [new ServiceAdminAuthGroup(adminMock, [service])];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Create).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Cancel).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reschedule).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Accept).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reject).hasPermission(groups)).toBe(true);
	});

	it('should reject service admin permission for a different service', async () => {
		const booking = new BookingBuilder()
			.withServiceId(service.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		booking.service = service;

		const serviceB = Service.create('service 4', organisation);
		serviceB.id = 4;

		const groups = [new ServiceAdminAuthGroup(adminMock, [serviceB])];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Create).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Cancel).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reschedule).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Accept).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reject).hasPermission(groups)).toBe(false);
	});

	it('should validate service provider action permission', async () => {
		const serviceProvider = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');
		serviceProvider.id = 10;
		const booking = new BookingBuilder()
			.withServiceId(service.id)
			.withServiceProviderId(serviceProvider.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		booking.service = service;

		const groups = [new ServiceProviderAuthGroup(adminMock, serviceProvider)];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Create).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Cancel).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reschedule).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Accept).hasPermission(groups)).toBe(true);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reject).hasPermission(groups)).toBe(true);
	});

	it('should reject service provider permission for a different service provider', async () => {
		const serviceProvider = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');
		serviceProvider.id = 10;
		const booking = new BookingBuilder()
			.withServiceId(service.id)
			.withServiceProviderId(serviceProvider.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		booking.service = service;

		const serviceProviderB = ServiceProvider.create('Jhon', service.id, 'test@email.com', '0000');
		serviceProviderB.id = 11;

		const groups = [new ServiceProviderAuthGroup(adminMock, serviceProviderB)];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Create).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Cancel).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reschedule).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Accept).hasPermission(groups)).toBe(false);
		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Reject).hasPermission(groups)).toBe(false);
	});

	it('should validate multiple groups', async () => {
		const serviceProvider = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');
		serviceProvider.id = 10;
		const booking = new BookingBuilder()
			.withServiceId(service.id)
			.withServiceProviderId(serviceProvider.id)
			.withCitizenUinFin('ABC1234')
			.withStartDateTime(new Date('2020-10-01T01:00:00'))
			.withEndDateTime(new Date('2020-10-01T02:00:00'))
			.build();

		booking.service = service;

		const serviceProviderB = ServiceProvider.create('Jhon', service.id, 'test@email.com', '0000');
		serviceProviderB.id = 11;

		const groups = [
			new ServiceProviderAuthGroup(adminMock, serviceProviderB),
			new ServiceAdminAuthGroup(adminMock, [service]),
		];

		expect(new BookingActionAuthVisitor(booking, ChangeLogAction.Update).hasPermission(groups)).toBe(true);
	});
});
