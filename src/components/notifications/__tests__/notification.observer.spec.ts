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
import { Booking, Service, ServiceProvider, User } from '../../../models';
import { BookingType } from '../../../models/bookingType';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import {
	ServiceProviderEmailTemplateBookingActionByCitizen,
	ServiceProviderEmailTemplateBookingActionByServiceProvider,
} from '../templates/serviceProviders.mail';

const adminMock = User.createAdminUser({
	molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
	userName: 'UserName',
	email: 'test@email.com',
	name: 'Name',
});

describe('Test template call', () => {
	let booking: Booking;
	beforeAll(() => {
		Container.bind(NotificationsService).to(NotificationsServiceMock);
		Container.bind(BookingsSubject).to(BookingsSubjectMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(CitizenEmailTemplateBookingActionByCitizen).to(EmailBookingTemplateMock);
		Container.bind(CitizenEmailTemplateBookingActionByServiceProvider).to(EmailBookingTemplateMock);
		Container.bind(ServiceProviderEmailTemplateBookingActionByCitizen).to(EmailBookingTemplateMock);
		Container.bind(ServiceProviderEmailTemplateBookingActionByServiceProvider).to(EmailBookingTemplateMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		((getConfig as unknown) as jest.Mock).mockReturnValue({});
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		const templateValue = { to: 'to', html: 'html' };
		EmailBookingTemplateMock.CreatedBookingEmailMock.mockReturnValue(templateValue);
		EmailBookingTemplateMock.UpdatedBookingEmailMock.mockReturnValue(templateValue);
		EmailBookingTemplateMock.CancelledBookingEmailMock.mockReturnValue(templateValue);

		booking = new Booking();
		booking.startDateTime = new Date('2021-04-14T02:00:00.000Z');
		booking.endDateTime = new Date('2021-04-14T03:00:00.000Z');
		booking.service = ({ _name: 'Career' } as unknown) as Service;
		booking.status = 1;
		booking.citizenEmail = 'email@email.com';
		booking.service = ({
			_name: 'Career',
			sendNotifications: true,
			sendNotificationsToServiceProviders: true,
		} as unknown) as Service;
		booking.serviceProvider = { email: 'test' } as ServiceProvider;
	});

	it('should reject if not email citizen email', async () => {
		booking.citizenEmail = undefined;
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		const instance = Container.get(MailObserver).update(bookingSubject);
		await expect(instance).rejects.toThrowError('Email not found');
	});

	it('should reject if not email for service provider', async () => {
		booking.serviceProvider.email = undefined;
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		const instance = Container.get(MailObserver).update(bookingSubject);
		await expect(instance).rejects.toThrowError('Email not found');
	});

	it('should not send if template empty email', async () => {
		booking.serviceProvider.email = undefined;

		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(MailObserver).update(bookingSubject);
		expect(EmailBookingTemplateMock.CreatedBookingEmailMock).toHaveBeenCalledTimes(2);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledTimes(0);
	});

	it('should send only one if sendNotificationsToServiceProviders = false', async () => {
		booking.service.sendNotificationsToServiceProviders = false;
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(MailObserver).update(bookingSubject);
		expect(EmailBookingTemplateMock.CreatedBookingEmailMock).toHaveBeenCalledTimes(1);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledTimes(1);
	});

	it('should not send if sendNotifications = false', async () => {
		booking.service.sendNotifications = false;
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(MailObserver).update(bookingSubject);
		expect(EmailBookingTemplateMock.CreatedBookingEmailMock).toHaveBeenCalledTimes(0);
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledTimes(0);
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

});
