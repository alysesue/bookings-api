import { Inject, InRequestScope } from 'typescript-ioc';
import { NotificationsService } from './notifications.service';
import { IObserver, ISubject } from '../../infrastructure/observer';
import { BookingsSubject } from '../bookings/bookings.subject';
import { BookingStatus } from '../../models';

@InRequestScope
export class MailObserver implements IObserver {
	@Inject
	private notificationService: NotificationsService;
	public async update(subject: ISubject<any>): Promise<void> {
		if (subject instanceof BookingsSubject && subject.booking && subject.booking.booking.status !== BookingStatus.OnHold) {
			const [body1, body2] = this.notificationService.createEmail(subject);
			await this.notificationService.sendEmail(body1, body2);
		}
	}
}
