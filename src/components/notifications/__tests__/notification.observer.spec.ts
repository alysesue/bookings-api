import { NotificationsServiceMock } from '../__mocks__/notification.service.mock';
import { Container } from 'typescript-ioc';
import { NotificationsService } from '../notifications.service';
import { BookingsSubjectMock } from '../../bookings/__mocks__/bookings.subject.mock';
import { BookingsSubject } from '../../bookings/bookings.subject';
import { MailObserver } from '../notification.observer';

describe('Test notification observer', () => {
	beforeAll(() => {
		Container.bind(NotificationsService).to(NotificationsServiceMock);
		Container.bind(BookingsSubject).to(BookingsSubjectMock);
	});

	it('Should test sendEmail if booking object here', async () => {
		const instance = await Container.get(MailObserver);
		instance.update(new BookingsSubjectMock());
		expect(NotificationsServiceMock.sendEmailMock).toHaveBeenCalledTimes(1);
	});
});
