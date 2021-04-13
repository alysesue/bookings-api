import { Inject, InRequestScope } from 'typescript-ioc';
import { NotificationsService } from './notifications.service';
import { IObserver, ISubject } from '../../infrastructure/observer';
import { BookingsSubject } from '../bookings/bookings.subject';
import { BookingStatus } from '../../models';
import { CreateEmailRequestApiDomain } from 'mol-lib-api-contract/notification/mail/create-email/create-email-api-domain';
import { EmailTemplateBase } from './notifications.templates';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';

@InRequestScope
export class MailObserver implements IObserver {
	@Inject
	private notificationService: NotificationsService;
	// @ts-ignore
	public async update(subject: ISubject<any>): void {
		if (
			subject instanceof BookingsSubject &&
			subject.booking &&
			subject.booking.booking.status !== BookingStatus.OnHold
		) {
			const citizenEmailBody = this.notificationService.createCitizenEmailFactory(subject);
			const serviceProviderEmailBody = this.notificationService.createServiceProviderEmailFactory(subject);
			const citizenEmailDetails = this.constructEmailTemplate(subject, citizenEmailBody, true, false);
			const serviceProviderEmailDetails = this.constructEmailTemplate(
				subject,
				serviceProviderEmailBody,
				false,
				true,
			);
			this.notificationService.sendEmail(citizenEmailDetails);
			this.notificationService.sendEmail(serviceProviderEmailDetails);
		}
	}

	private constructEmailTemplate(
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
