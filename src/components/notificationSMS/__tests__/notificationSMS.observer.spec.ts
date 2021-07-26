import { Container } from 'typescript-ioc';
import { BookingsSubject } from '../../bookings/bookings.subject';
import { BookingsSubjectMock } from '../../bookings/__mocks__/bookings.subject.mock';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { CitizenSMSTemplateBookingActionByCitizen } from '../templates/citizen.sms';
import { NotificationSMSService } from '../notificationSMS.service';
import { NotificationSMSServiceMock } from '../__mocks__/notificationSMS.service.mock';
import { Booking, Service, ServiceProvider, User } from '../../../models';
import { BookingType } from '../../../models/bookingType';
import { SMSObserver } from '../notificationSMS.observer';
import { SMSBookingTemplateMock } from '../templates/__mocks__/citizen.sms.mock';
import { getConfig } from '../../../config/app-config';

jest.mock('../../../config/app-config', () => ({
	getConfig: jest.fn(),
}));

const adminMock = User.createAdminUser({
	molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
	userName: 'UserName',
	email: 'test@email.com',
	name: 'Name',
});

describe('Test notificationSMS observer', () => {
	let booking: Booking;
	beforeAll(() => {
		Container.bind(NotificationSMSService).to(NotificationSMSServiceMock);
		Container.bind(BookingsSubject).to(BookingsSubjectMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(CitizenSMSTemplateBookingActionByCitizen).to(SMSBookingTemplateMock);
		Container.bind(CitizenSMSTemplateBookingActionByCitizen).to(SMSBookingTemplateMock);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		SMSBookingTemplateMock.CreatedBookingSMSMock.mockReturnValue('');
		SMSBookingTemplateMock.UpdatedBookingSMSMock.mockReturnValue('');
		SMSBookingTemplateMock.CancelledBookingSMSMock.mockReturnValue('');

		booking = new Booking();
		booking.startDateTime = new Date('2021-04-14T02:00:00.000Z');
		booking.endDateTime = new Date('2021-04-14T03:00:00.000Z');
		booking.status = 1;
		booking.citizenEmail = 'email@email.com';
		booking.service = ({
			_name: 'Career',
			sendNotifications: true,
			sendNotificationsToServiceProviders: true,
			sendSMSNotifications: true,
		} as unknown) as Service;
		booking.serviceProvider = { email: 'test' } as ServiceProvider;
		booking.uuid = 'f4533bed-da08-473a-8641-7aef918fe0db';
		(getConfig as jest.Mock).mockReturnValue({
			appURL: 'http://www.local.booking.gov.sg:3000',
		});
	});

	it('should not call send sms if no phone', async () => {
		booking.citizenEmail = undefined;
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(SMSObserver).update(bookingSubject);
		await expect(NotificationSMSServiceMock.sendMock).toHaveBeenCalledTimes(0);
	});

	it('should not call send sms if flag sendSMSNotifications false', async () => {
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(SMSObserver).update(bookingSubject);
		await expect(NotificationSMSServiceMock.sendMock).toHaveBeenCalledTimes(0);
	});

	it('should call send sms if phone present', async () => {
		booking.citizenPhone = '230';
		const bookingSubject = new BookingsSubject();
		bookingSubject.notify({ booking, bookingType: BookingType.Created });
		await Container.get(SMSObserver).update(bookingSubject);
		await expect(NotificationSMSServiceMock.sendMock).toHaveBeenCalledTimes(1);
	});
});
