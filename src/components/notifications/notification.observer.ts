import { Inject, InRequestScope } from 'typescript-ioc';
import { NotificationsService } from './notifications.service';
import { IObserver, ISubject } from '../../infrastructure/observer';
import { BookingsSubject } from '../bookings/bookings.subject';

@InRequestScope
export class MailObserver implements IObserver {
	@Inject
	private notificationService: NotificationsService;
	public update(subject: ISubject<any>): void {
		if (subject instanceof BookingsSubject && subject.booking) {
			const body = NotificationsService.templateEmailBooking(subject.booking);
			this.notificationService.sendEmail(body);
		}
	}
}
