import { BookingStatus, Organisation, Service, User } from '../../../../models';
import { Container } from 'typescript-ioc';
import { ContainerContext, ContainerContextHolder } from '../../../../infrastructure/containerContext';
import { BookingsEventValidatorFactory } from '../bookings.event.validation';
import { Booking, BookingBuilder } from '../../../../models/entities/booking';
import { DateHelper } from '../../../../infrastructure/dateHelper';
import { UserContext } from '../../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../../infrastructure/auth/__mocks__/userContext';
import { CaptchaServiceMock } from '../../../../components/captcha/__mocks__/captcha.service.mock';
import { getConfig } from '../../../../config/app-config';
import { BookingsRepository } from '../../bookings.repository';
import { BookingRepositoryMock } from '../../__mocks__/bookings.mocks';
import { EventsService } from '../../../events/events.service';
import { EventsServiceMock } from '../../../events/__mocks__/events.service.mock';
import { Event } from '../../../../models';

beforeAll(() => {
	ContainerContextHolder.registerInContainer();
});

// tslint:disable-next-line:no-big-function
describe('Booking event validation tests', () => {
	let service: Service;
	const mockSingpassUser1 = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});

	beforeEach(() => {
		jest.resetAllMocks();
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(BookingsRepository).to(BookingRepositoryMock);
		Container.bind(EventsService).to(EventsServiceMock);
		CaptchaServiceMock.verify.mockReturnValue(Promise.resolve(true));
		(getConfig as jest.Mock).mockReturnValue({
			isAutomatedTest: false,
		});

		service = Service.create('svc', new Organisation());
		service.id = 1;
		service.setNoNric(false);
		service.hasSalutation = false;
	});

	it('should get same factory instance in Request scope', () => {
		const context = Container.get(ContainerContext);
		const getFactory = () => context.resolve(BookingsEventValidatorFactory);

		expect(getFactory() === getFactory()).toBe(true);
	});

	it('should not allow to book an event, if bookings >= capacity (standalone flow)', async () => {
		const start = new Date(2050, 8, 26, 8, 0);
		const end = DateHelper.addMinutes(start, 45);
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(end)
			.withServiceProviderId(1)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(1)
			.withEventId(1)
			.withAutoAccept(true)
			.build();
		booking.status = BookingStatus.OnHold;
		booking.onHoldUntil = new Date();
		booking.onHoldUntil.setMinutes(booking.onHoldUntil.getMinutes() + 10);

		const mockEvent = new Event();
		mockEvent.id = 1;
		mockEvent.capacity = 1;
		booking.service = service;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(mockSingpassUser1));
		const mockBooking = new BookingBuilder().withStartDateTime(start).withEndDateTime(end).withEventId(1).build();
		mockBooking.id = 10;
		BookingRepositoryMock.searchReturnAll.mockImplementation(() => Promise.resolve([mockBooking] as Booking[]));
		EventsServiceMock.getById.mockImplementation(() => Promise.resolve(mockEvent));
		const validator = Container.get(BookingsEventValidatorFactory).getValidator(false);
		validator.bypassCaptcha(true);
		const test = async () => await validator.validate(booking);

		await expect(test).rejects.toMatchInlineSnapshot('[BusinessError: [10017] Event is out of capacity]');
	});

	it('should not allow to book an event, if bookings >= capacity (default / non-standalone flow)', async () => {
		const start = new Date(2050, 8, 26, 8, 0);
		const end = DateHelper.addMinutes(start, 45);
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(end)
			.withServiceProviderId(1)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(1)
			.withEventId(1)
			.withAutoAccept(true)
			.build();
		booking.status = BookingStatus.Accepted;
		booking.onHoldUntil = new Date();
		booking.onHoldUntil.setMinutes(booking.onHoldUntil.getMinutes() + 10);

		const mockEvent = new Event();
		mockEvent.id = 1;
		mockEvent.capacity = 1;
		booking.service = service;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(mockSingpassUser1));
		const mockBooking = new BookingBuilder().withStartDateTime(start).withEndDateTime(end).withEventId(1).build();
		mockBooking.id = 10;
		BookingRepositoryMock.searchReturnAll.mockImplementation(() => Promise.resolve([mockBooking] as Booking[]));
		EventsServiceMock.getById.mockImplementation(() => Promise.resolve(mockEvent));
		const validator = Container.get(BookingsEventValidatorFactory).getValidator(false);
		validator.bypassCaptcha(true);
		const test = async () => await validator.validate(booking);

		await expect(test).rejects.toMatchInlineSnapshot('[BusinessError: [10017] Event is out of capacity]');
	});

	it('it should allow me to continue with my onHold event booking after submission of standalone form', async () => {
		const start = new Date(2050, 8, 26, 8, 0);
		const end = DateHelper.addMinutes(start, 45);
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(end)
			.withServiceProviderId(1)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(1)
			.withEventId(1)
			.withAutoAccept(true)
			.build();
		booking.onHoldUntil = new Date();
		booking.onHoldUntil.setMinutes(booking.onHoldUntil.getMinutes() + 10);
		booking.id = 10;

		const mockEvent = new Event();
		mockEvent.id = 1;
		mockEvent.capacity = 1;
		booking.service = service;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(mockSingpassUser1));
		const mockBooking = new BookingBuilder().withStartDateTime(start).withEndDateTime(end).withEventId(1).build();
		mockBooking.id = 10;
		mockBooking.status = BookingStatus.OnHold;
		mockBooking.onHoldUntil = new Date();
		mockBooking.onHoldUntil.setMinutes(mockBooking.onHoldUntil.getMinutes() + 10);
		BookingRepositoryMock.searchReturnAll.mockImplementation(() => Promise.resolve([mockBooking] as Booking[]));
		EventsServiceMock.getById.mockImplementation(() => Promise.resolve(mockEvent));
		const validator = Container.get(BookingsEventValidatorFactory).getValidator(false);
		validator.bypassCaptcha(true);
		await expect(validator.validate(booking)).resolves.toEqual(undefined);
	});

	it('it should allow me to make a booking, if previous onHold booking expired i.e. onHoldUntil < currentDateTime', async () => {
		const start = new Date(2050, 8, 26, 8, 0);
		const end = DateHelper.addMinutes(start, 45);
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(end)
			.withServiceProviderId(1)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(1)
			.withEventId(1)
			.withAutoAccept(true)
			.build();
		booking.onHoldUntil = new Date();
		booking.onHoldUntil.setMinutes(booking.onHoldUntil.getMinutes() + 10);

		const mockEvent = new Event();
		mockEvent.id = 1;
		mockEvent.capacity = 1;
		booking.service = service;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(mockSingpassUser1));
		const mockBooking = new BookingBuilder().withStartDateTime(start).withEndDateTime(end).withEventId(1).build();
		mockBooking.id = 10;
		mockBooking.status = BookingStatus.OnHold;
		mockBooking.onHoldUntil = new Date();
		mockBooking.onHoldUntil.setMinutes(mockBooking.onHoldUntil.getMinutes() - 10);
		BookingRepositoryMock.searchReturnAll.mockImplementation(() => Promise.resolve([mockBooking] as Booking[]));
		EventsServiceMock.getById.mockImplementation(() => Promise.resolve(mockEvent));
		const validator = Container.get(BookingsEventValidatorFactory).getValidator(false);
		validator.bypassCaptcha(true);
		await expect(validator.validate(booking)).resolves.toEqual(undefined);
	});

	it('it should not allow me to make a new booking, if previous onHold booking is still valid', async () => {
		const start = new Date(2050, 8, 26, 8, 0);
		const end = DateHelper.addMinutes(start, 45);
		const booking = new BookingBuilder()
			.withStartDateTime(start)
			.withEndDateTime(end)
			.withServiceProviderId(1)
			.withRefId('RFM186')
			.withCitizenUinFin('G3382058K')
			.withCitizenName('Andy')
			.withCitizenEmail('email@gmail.com')
			.withServiceId(1)
			.withEventId(1)
			.withAutoAccept(true)
			.build();
		booking.onHoldUntil = new Date();
		booking.onHoldUntil.setMinutes(booking.onHoldUntil.getMinutes() + 10);

		const mockEvent = new Event();
		mockEvent.id = 1;
		mockEvent.capacity = 1;
		booking.service = service;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(mockSingpassUser1));
		const mockBooking = new BookingBuilder().withStartDateTime(start).withEndDateTime(end).withEventId(1).build();
		mockBooking.id = 10;
		mockBooking.status = BookingStatus.OnHold;
		mockBooking.onHoldUntil = new Date();
		mockBooking.onHoldUntil.setMinutes(mockBooking.onHoldUntil.getMinutes() + 10);
		BookingRepositoryMock.searchReturnAll.mockImplementation(() => Promise.resolve([mockBooking] as Booking[]));
		EventsServiceMock.getById.mockImplementation(() => Promise.resolve(mockEvent));
		const validator = Container.get(BookingsEventValidatorFactory).getValidator(false);
		validator.bypassCaptcha(true);
		const test = async () => await validator.validate(booking);
		await expect(test).rejects.toMatchInlineSnapshot('[BusinessError: [10017] Event is out of capacity]');
	});
});
