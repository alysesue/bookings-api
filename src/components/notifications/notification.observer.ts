import { InRequestScope } from 'typescript-ioc';
import { ISubject, Observer } from '../../infrastructure/observer';
import { BookingsSubject } from '../bookings/bookings.subject';
import { BookingStatus } from '../../models';
import { NotificationsService } from './notifications.service';
import { EmailTemplateBase } from './templates/citizen.mail';
import { CreateEmailRequestApiDomain } from 'mol-lib-api-contract/notification/mail/create-email/create-email-api-domain';
import { MOLErrorV2 } from 'mol-lib-api-contract/error';
import { ErrorCodeV2 } from 'mol-lib-api-contract';

@InRequestScope
export class MailObserver implements Observer {
	public update(subject: ISubject<any>): void {
		const notificationsService = new NotificationsService();
		if (
			subject instanceof BookingsSubject &&
			subject.booking &&
			subject.booking.booking.status !== BookingStatus.OnHold
		) {
			const citizenEmailBody = notificationsService.createCitizenEmailFactory(subject);
			const serviceProviderEmailBody = notificationsService.createServiceProviderEmailFactory(subject);
			const citizenEmailDetails = MailObserver.constructEmailTemplate(subject, citizenEmailBody, true, false);
			const serviceProviderEmailDetails = MailObserver.constructEmailTemplate(
				subject,
				serviceProviderEmailBody,
				false,
				true,
			);
			notificationsService.sendEmail(citizenEmailDetails);
			notificationsService.sendEmail(serviceProviderEmailDetails);
		}
	}

	private static constructEmailTemplate(
		subject: ISubject<any>,
		emailTemplate: EmailTemplateBase,
		citizen: boolean,
		serviceProvider: boolean,
	): CreateEmailRequestApiDomain {
		let email;
		if (citizen) {
			if (subject instanceof BookingsSubject && subject.booking.booking.citizenEmail) {
				email = subject.booking.booking.citizenEmail;
			} else {
				throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
			}
		}
		if (serviceProvider) {
			if (subject instanceof BookingsSubject && subject.booking.booking.serviceProvider.email) {
				email = subject.booking.booking.serviceProvider.email;
			} else {
				throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
			}
		}
		return {
			to: [email],
			subject: emailTemplate.subject,
			html: emailTemplate.html,
		};
	}
}
