import { Inject, InRequestScope } from 'typescript-ioc';
import { ISubject, Observer } from '../../infrastructure/observer';
import { BookingsSubject } from '../bookings/bookings.subject';
import { Booking, BookingStatus } from '../../models';
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
import {
	ServiceProviderEmailTemplateBookingActionByCitizen,
	ServiceProviderEmailTemplateBookingActionByServiceProvider,
} from './templates/serviceProviders.mail';
import { BookingType } from '../../models/bookingType';
import { MailOptions } from './notifications.mapper';

@InRequestScope
export class MailObserver implements Observer {
	@Inject
	private notificationsService: NotificationsService;
	@Inject
	private userContext: UserContext;

	public async update(subject: ISubject<any>): Promise<void> {
		if (subject instanceof BookingsSubject && subject.booking && subject.booking.status !== BookingStatus.OnHold) {
			console.log('========================================');
			console.log(require('util').inspect(subject, false, null, true /* enable colors */));
			console.log('========================================');
			const citizenEmailBody = await this.createCitizenEmailFactory(subject);
			const serviceProviderEmailBody = await this.createServiceProviderEmailFactory(subject);
			const citizenEmailDetails = MailObserver.constructEmailTemplate(subject, citizenEmailBody, true, false);
			const serviceProviderEmailDetails = MailObserver.constructEmailTemplate(
				subject,
				serviceProviderEmailBody,
				false,
				true,
			);
			this.notificationsService.sendEmail(citizenEmailDetails);
			this.notificationsService.sendEmail(serviceProviderEmailDetails);
		}
	}

	private async createCitizenEmailFactory(data: BookingsSubject): Promise<EmailTemplateBase> {
		const currentUser = await this.userContext.getCurrentUser();
		const userIsAdmin = currentUser.isAdmin() || currentUser.isAgency();
		const templates = userIsAdmin
			? new CitizenEmailTemplateBookingActionByServiceProvider()
			: new CitizenEmailTemplateBookingActionByCitizen();
		return this.templateFactory(data.booking, data.bookingType, templates);
	}

	private async createServiceProviderEmailFactory(data: BookingsSubject): Promise<EmailTemplateBase> {
		const currentUser = await this.userContext.getCurrentUser();
		const userIsAdmin = currentUser.isAdmin() || currentUser.isAgency();
		const templates = userIsAdmin
			? new ServiceProviderEmailTemplateBookingActionByServiceProvider()
			: new ServiceProviderEmailTemplateBookingActionByCitizen();
		return this.templateFactory(data.booking, data.bookingType, templates);
	}

	private templateFactory(
		data: Booking,
		bookingType: BookingType,
		templates: EmailBookingTemplate,
	): EmailTemplateBase | undefined {
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

	private static constructEmailTemplate(
		subject: ISubject<BookingsSubject>,
		emailTemplate: EmailTemplateBase | undefined,
		citizen: boolean,
		serviceProvider: boolean,
	): MailOptions {
		let email;
		if (citizen) {
			if (subject instanceof BookingsSubject && subject.booking.citizenEmail) {
				email = subject.booking.citizenEmail;
			} else {
				throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
			}
		}
		if (serviceProvider) {
			if (subject instanceof BookingsSubject && subject.booking.serviceProvider.email) {
				email = subject.booking.serviceProvider.email;
			} else {
				throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
			}
		}
		return {
			to: [email],
			subject: emailTemplate?.subject,
			html: emailTemplate?.html,
		};
	}
}
