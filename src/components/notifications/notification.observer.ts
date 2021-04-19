import { Inject, InRequestScope } from 'typescript-ioc';
import { ISubject, Observer } from '../../infrastructure/observer';
import { BookingsSubject } from '../bookings/bookings.subject';
import { BookingStatus } from '../../models';
import { NotificationsService } from './notifications.service';
import {
	CitizenEmailTemplateBookingActionByCitizen,
	CitizenEmailTemplateBookingActionByServiceProvider,
	EmailBookingTemplate,
	EmailTemplateBase,
} from './templates/citizen.mail';
import { MOLErrorV2 } from 'mol-lib-api-contract/error';
import { ErrorCodeV2 } from 'mol-lib-api-contract';
import { UserContext } from '../../infrastructure/auth/userContext';
import { MailOptions } from './MailOptions';
import {
	ServiceProviderEmailTemplateBookingActionByCitizen,
	ServiceProviderEmailTemplateBookingActionByServiceProvider,
} from './templates/serviceProviders.mail';
import { BookingType } from '../../models/bookingType';

@InRequestScope
export class MailObserver implements Observer {
	@Inject
	private notificationsService: NotificationsService;
	@Inject
	private userContext: UserContext;

	public update(subject: ISubject<any>): void {
		// const notificationsService = new NotificationsService();
		if (
			subject instanceof BookingsSubject &&
			subject.booking &&
			subject.booking.booking.status !== BookingStatus.OnHold
		) {
			console.log('========================================');
			console.log(require('util').inspect(subject, false, null, true /* enable colors */));
			console.log('========================================');
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

	public createCitizenEmailFactory(data): EmailTemplateBase {
		const currentUser = await this.userContext.getCurrentUser();
		const userIsAdmin = currentUser.isAdmin() || currentUser.isAgency();
		const templates = userIsAdmin
			? CitizenEmailTemplateBookingActionByServiceProvider
			: CitizenEmailTemplateBookingActionByCitizen;
		this.templateFactory(data, BookingStatus[data._booking._status], templates);
	}

	private templateFactory(data, bookingType: BookingType, templates: EmailBookingTemplate): EmailBookingTemplate {
		switch (bookingType) {
			case BookingType.Created:
				return templates.CreatedBookingEmail(data);
			case BookingType.Updated:
				return templates.UpdatedBookingEmail(data);
			case BookingType.CancelledOrRejected:
				return templates.CancelledBookingEmail(data);
			default:
				return;
		}
	}

	public createServiceProviderEmailFactory(data): EmailTemplateBase {
		const currentUser = await this.userContext.getCurrentUser();
		const userIsAdmin = currentUser.isAdmin() || currentUser.isAgency();
		const templates = userIsAdmin
			? ServiceProviderEmailTemplateBookingActionByServiceProvider
			: ServiceProviderEmailTemplateBookingActionByCitizen;
		this.templateFactory(data, BookingStatus[data._booking._status], templates);
		// if (data._bookingType === BookingType.Created && data._userType._singPassUser)
		// 	return ServiceProviderEmailTemplateBookingActionByCitizen.CreatedBookingEmail(data);
		// if (data._bookingType === BookingType.Updated && data._userType._singPassUser)
		// 	return ServiceProviderEmailTemplateBookingActionByCitizen.UpdatedBookingEmail(data);
		// if (data._bookingType === BookingType.CancelledOrRejected && data._userType._singPassUser)
		// 	return ServiceProviderEmailTemplateBookingActionByCitizen.CancelledBookingEmail(data);
		// if (data._bookingType === BookingType.Updated && data._userType._adminUser)
		// 	return ServiceProviderEmailTemplateBookingActionByServiceProvider.UpdatedBookingEmail(data);
		// if (data._bookingType === BookingType.CancelledOrRejected && data._userType._adminUser)
		// 	return ServiceProviderEmailTemplateBookingActionByServiceProvider.CancelledBookingEmail(data);
	}

	private static constructEmailTemplate(
		subject: ISubject<any>,
		emailTemplate: EmailTemplateBase,
		citizen: boolean,
		serviceProvider: boolean,
	): MailOptions {
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
