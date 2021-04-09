import {Inject, InRequestScope} from 'typescript-ioc';
import {NotificationsService} from './notifications.service';
import {IObserver, ISubject} from '../../infrastructure/observer';
import {BookingsSubject} from '../bookings/bookings.subject';
import {BookingStatus} from '../../models';

@InRequestScope
export class MailObserver implements IObserver {
	@Inject
	private notificationService: NotificationsService;
	public async update(subject: ISubject<any>): void {
		if (subject instanceof BookingsSubject && subject.booking && subject.booking.booking.status !== BookingStatus.OnHold) {
			const citizenEmailBody = this.notificationService.createCitizenEmailFactory(subject);
			const serviceProviderEmailBody = this.notificationService.createServiceProviderEmailFactory(subject);
			this.notificationService.sendEmail(citizenEmailBody);
			this.notificationService.sendEmail(serviceProviderEmailBody);
		}
	}
}
