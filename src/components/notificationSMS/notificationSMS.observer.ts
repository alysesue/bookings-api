import { Inject, InRequestScope } from 'typescript-ioc';
import { ISubject, Observer } from '../../infrastructure/observer';
import { BookingsSubject } from '../bookings/bookings.subject';
import { Booking, BookingStatus, Organisation } from '../../models';
import { BookingType } from '../../models/bookingType';
import {
	CitizenSMSTemplateBookingActionByCitizen,
	CitizenSMSTemplateBookingActionByServiceProvider,
	SMSBookingTemplate,
} from './templates/citizen.sms';
import { UserContext } from '../../infrastructure/auth/userContext';
import { NotificationSMSService, SMSmessage } from './notificationSMS.service';

@InRequestScope
export class SMSObserver implements Observer {
	@Inject
	private citizenSMSTemplateBookingActionByServiceProvider: CitizenSMSTemplateBookingActionByServiceProvider;
	@Inject
	private citizenSMSTemplateBookingActionByCitizen: CitizenSMSTemplateBookingActionByCitizen;
	@Inject
	private userContext: UserContext;
	@Inject
	private notificationSMSService: NotificationSMSService;

	public async update<T>(subject: ISubject<T>): Promise<void> {
		if (subject instanceof BookingsSubject && subject.booking?.status !== BookingStatus.OnHold) {
			if (!subject.booking.service.sendSMSNotifications) return;
			if (!subject.booking.citizenPhone) return;
			const currentUser = await this.userContext.getCurrentUser();
			const userIsAdmin = currentUser.isAdmin() || currentUser.isAgency();
			const templates = userIsAdmin
				? this.citizenSMSTemplateBookingActionByServiceProvider
				: this.citizenSMSTemplateBookingActionByCitizen;
			const sms = this.templateFactory(subject.booking, subject.bookingType, templates);
			const phoneNumber = subject.booking.citizenPhone;
			const organisationName = subject.booking.service.organisation.name;
			try {
				await this.notificationSMSService.send(
					{ message: sms, phoneNumber }, organisationName);
			} catch (error) {
				// No need to do anything for now
			}
		}
	}

	private templateFactory(
		data: Booking,
		bookingType: BookingType,
		templates: SMSBookingTemplate,
	): SMSmessage | undefined {
		switch (bookingType) {
			case BookingType.Created:
				return templates.CreatedBookingSMS(data);
			case BookingType.Updated:
				return templates.UpdatedBookingSMS(data);
			case BookingType.CancelledOrRejected:
				return templates.CancelledBookingSMS(data);
			default:
				return;
		}
	}
}
