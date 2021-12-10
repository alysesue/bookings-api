import { NotificationsServiceMock } from '../__mocks__/notification.service.mock';
import { Container } from 'typescript-ioc';
import { NotificationsService } from '../notifications.service';
import { BookingsSubjectMock } from '../../bookings/__mocks__/bookings.subject.mock';
import { BookingsSubject } from '../../bookings/bookings.subject';
import { MailObserver } from '../notification.observer';
import { EmailBookingTemplateMock } from '../templates/__mocks__/citizen.mail.mock';
import {
	CitizenEmailTemplateBookingActionByCitizen,
	CitizenEmailTemplateBookingActionByServiceProvider,
} from '../templates/citizen.mail';
import { getConfig } from '../../../config/app-config';
import {
	Booking,
	BookingStatus,
	Service,
	ServiceProvider,
	User,
	Event,
	OneOffTimeslot,
	AdminUser,
} from '../../../models';
import { BookingType } from '../../../models/bookingType';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import {
	ServiceProviderEmailTemplateBookingActionByCitizen,
	ServiceProviderEmailTemplateBookingActionByServiceProvider,
} from '../templates/serviceProviders.mail';
import { logger } from 'mol-lib-common';
import { EmailRecipient } from '../notifications.enum';
import { MailOptions } from '../notifications.mapper';
import { IServiceProvider } from '../../../models/interfaces';
import {
	CitizenEventEmailTemplateBookingActionByCitizen,
	CitizenEventEmailTemplateBookingActionByServiceProvider,
} from '../templates/citizen.event.mail';
import {
	ServiceProviderEventEmailTemplateBookingActionByCitizen,
	ServiceProviderEventEmailTemplateBookingActionByServiceProvider,
} from '../templates/serviceProviders.event.mail';

const adminMock = User.createAdminUser({
	molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
	userName: 'UserName',
	email: 'test@email.com',
	name: 'Name',
});

describe('Test template call', () => {
	let booking: Booking;

	const setBookingForEvent = (booking: Booking) => {
		booking.event = new Event();
		booking.event.title = 'event title';
		const oneOffTimeslot = new OneOffTimeslot();
		oneOffTimeslot.startDateTime = new Date(2021, 3, 14, 10);
		oneOffTimeslot.endDateTime = new Date(2021, 3, 14, 11);
		oneOffTimeslot.serviceProvider = { name: 'John Doe', email: 'john@email.com' } as IServiceProvider;
		const oneOffTimeslot2 = new OneOffTimeslot();
		oneOffTimeslot2.startDateTime = new Date(2021, 3, 14, 10);
		oneOffTimeslot2.endDateTime = new Date(2021, 3, 14, 11);
		oneOffTimeslot2.serviceProvider = { name: 'Jane Doe', email: 'jane@email.com' } as IServiceProvider;
		const oneOffTimeslot3 = new OneOffTimeslot();
		oneOffTimeslot3.startDateTime = new Date(2021, 3, 14, 10);
		oneOffTimeslot3.endDateTime = new Date(2021, 3, 14, 11);
		oneOffTimeslot3.serviceProvider = { name: 'Dana Doe', email: 'dana@email.com' } as IServiceProvider;
		booking.event.oneOffTimeslots = [oneOffTimeslot, oneOffTimeslot2, oneOffTimeslot3];
		booking.eventId = 1;
	};
	beforeAll(() => {
		Container.bind(NotificationsService).to(NotificationsServiceMock);
		Container.bind(BookingsSubject).to(BookingsSubjectMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(CitizenEmailTemplateBookingActionByCitizen).to(EmailBookingTemplateMock);
		Container.bind(CitizenEmailTemplateBookingActionByServiceProvider).to(EmailBookingTemplateMock);
		Container.bind(ServiceProviderEmailTemplateBookingActionByCitizen).to(EmailBookingTemplateMock);
		Container.bind(ServiceProviderEmailTemplateBookingActionByServiceProvider).to(EmailBookingTemplateMock);
		Container.bind(CitizenEventEmailTemplateBookingActionByCitizen).to(EmailBookingTemplateMock);
		Container.bind(CitizenEventEmailTemplateBookingActionByServiceProvider).to(EmailBookingTemplateMock);
		Container.bind(ServiceProviderEventEmailTemplateBookingActionByCitizen).to(EmailBookingTemplateMock);
		Container.bind(ServiceProviderEventEmailTemplateBookingActionByServiceProvider).to(EmailBookingTemplateMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		((getConfig as unknown) as jest.Mock).mockReturnValue({});
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		const templateValue = { to: 'to', html: 'html' };
		EmailBookingTemplateMock.CreatedBookingEmailMock.mockReturnValue(templateValue);
		EmailBookingTemplateMock.UpdatedBookingEmailMock.mockReturnValue(templateValue);
		EmailBookingTemplateMock.CancelledBookingEmailMock.mockReturnValue(templateValue);
		EmailBookingTemplateMock.ApprovedBySABookingEmailMock.mockReturnValue(templateValue);
		(logger.info as jest.Mock).mockImplementation(() => {});

		booking = new Booking();
		booking.startDateTime = new Date('2021-04-14T02:00:00.000Z');
		booking.endDateTime = new Date('2021-04-14T03:00:00.000Z');
		booking.status = BookingStatus.PendingApproval;
		booking.citizenEmail = 'email@email.com';
		booking.citizenName = 'test info';
		booking.service = ({
			_name: 'Career',
			sendNotifications: true,
			sendNotificationsToServiceProviders: true,
			adminUsers: [],
		} as unknown) as Service;
		booking.serviceProvider = { email: 'test', name: 'test sp info' } as ServiceProvider;
	});

	it('should reject if not email citizen', async () => {
		booking.citizenEmail = undefined;
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(MailObserver).update(bookingSubject);
		expect(logger.info as jest.Mock).toBeCalledWith(
			`Email not sent out for booking id (${booking.id}) as ${EmailRecipient.Citizen} email is not provided`,
		);
	});

	it('should reject if not email for service provider', async () => {
		booking.serviceProvider.email = undefined;
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(MailObserver).update(bookingSubject);
		expect(logger.info as jest.Mock).toBeCalledWith(
			`Email not sent out for booking id (${booking.id}) as ${EmailRecipient.ServiceProvider} email is not provided`,
		);
	});

	it('should reject if no email for Service admins', async () => {
		booking.status = BookingStatus.PendingApprovalSA;
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(MailObserver).update(bookingSubject);
		expect(logger.info as jest.Mock).toBeCalledWith(
			`Email not sent out for booking id (${booking.id}) as ${EmailRecipient.ServiceAdmin} email is not provided`,
		);
	});

	it('should not send if template empty email', async () => {
		EmailBookingTemplateMock.CreatedBookingEmailMock.mockReturnValue(undefined);
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(MailObserver).update(bookingSubject);
		expect(EmailBookingTemplateMock.CreatedBookingEmailMock).toHaveBeenCalledTimes(2);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledTimes(0);
	});

	it('should not send if sendNotifications = false, sendNotificationsToServiceProviders = false', async () => {
		booking.service.sendNotificationsToServiceProviders = false;
		booking.service.sendNotifications = false;
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(MailObserver).update(bookingSubject);
		expect(EmailBookingTemplateMock.CreatedBookingEmailMock).toHaveBeenCalledTimes(0);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledTimes(0);
	});

	it('should send two if sendNotifications = true, sendNotificationsToServiceProviders = true', async () => {
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(MailObserver).update(bookingSubject);
		expect(EmailBookingTemplateMock.CreatedBookingEmailMock).toHaveBeenCalledTimes(2);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledTimes(2);
	});

	it('should send four if sendNotifications = true, sendNotificationsToServiceProviders = true with 3 SP', async () => {
		setBookingForEvent(booking);
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(MailObserver).update(bookingSubject);
		expect(EmailBookingTemplateMock.CreatedBookingEmailMock).toHaveBeenCalledTimes(2);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledTimes(4);
	});

	it('should send only one if sendNotifications = true and sendNotificationsToServiceProviders = false', async () => {
		booking.service.sendNotificationsToServiceProviders = false;
		const emailBody = {
			html: 'html',
			subject: undefined,
			to: [booking.citizenEmail],
		} as MailOptions;
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(MailObserver).update(bookingSubject);
		expect(EmailBookingTemplateMock.CreatedBookingEmailMock).toHaveBeenCalledTimes(1);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledTimes(1);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledWith(emailBody);
	});

	it('should send only one if sendNotifications = false, sendNotificationsToServiceProviders = true', async () => {
		booking.service.sendNotifications = false;
		const emailBody = {
			html: 'html',
			subject: undefined,
			to: [booking.serviceProvider.email],
		} as MailOptions;
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(MailObserver).update(bookingSubject);
		expect(EmailBookingTemplateMock.CreatedBookingEmailMock).toHaveBeenCalledTimes(1);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledTimes(1);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledWith(emailBody);
	});

	it('should send 2 emails with createTemplate when BookingType=Created', async () => {
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(MailObserver).update(bookingSubject);
		expect(EmailBookingTemplateMock.CreatedBookingEmailMock).toHaveBeenCalledTimes(2);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledTimes(2);
	});

	it('should send 2 emails with updateTemplate when BookingType = Updated', async () => {
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Updated });
		await Container.get(MailObserver).update(bookingSubject);
		expect(EmailBookingTemplateMock.UpdatedBookingEmailMock).toHaveBeenCalledTimes(2);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledTimes(2);
	});

	it('should send 2 emails with cancelTemplate when BookingType = Cancelled', async () => {
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.CancelledOrRejected });
		await Container.get(MailObserver).update(bookingSubject);
		expect(EmailBookingTemplateMock.CancelledBookingEmailMock).toHaveBeenCalledTimes(2);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledTimes(2);
	});

	it('should send 1 email with createTemplate when BookingType = Approved', async () => {
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.ApprovedBySA });
		await Container.get(MailObserver).update(bookingSubject);
		expect(EmailBookingTemplateMock.ApprovedBySABookingEmailMock).toHaveBeenCalledTimes(1);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledTimes(1);
	});

	it('should send 1 email to citizen and 1 email to each SA with createTemplate when BookingType = Create and booking status is pending SA approval', async () => {
		const bookingSubject = new BookingsSubject();
		booking.status = BookingStatus.PendingApprovalSA;
		booking.service.adminUsers.push({ email: 'test' } as AdminUser, { email: 'test' } as AdminUser);
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(MailObserver).update(bookingSubject);
		expect(EmailBookingTemplateMock.CreatedBookingEmailMock).toHaveBeenCalledTimes(2);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledTimes(3);
	});
});
