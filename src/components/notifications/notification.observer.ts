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
import { UserContext } from '../../infrastructure/auth/userContext';
import {
	ServiceProviderEmailTemplateBookingActionByCitizen,
	ServiceProviderEmailTemplateBookingActionByServiceProvider,
} from './templates/serviceProviders.mail';
import { BookingType } from '../../models/bookingType';
import { MailOptions } from './notifications.mapper';
import { logger } from 'mol-lib-common';
import { EmailRecipient } from './notifications.enum';

@InRequestScope
export class MailObserver implements Observer {
	@Inject
	private notificationsService: NotificationsService;
	@Inject
	private userContext: UserContext;
	@Inject
	private citizenEmailTemplateBookingActionByServiceProvider: CitizenEmailTemplateBookingActionByServiceProvider;
	@Inject
	private citizenEmailTemplateBookingActionByCitizen: CitizenEmailTemplateBookingActionByCitizen;
	@Inject
	private serviceProviderEmailTemplateBookingActionByServiceProvider: ServiceProviderEmailTemplateBookingActionByServiceProvider;
	@Inject
	private serviceProviderEmailTemplateBookingActionByCitizen: ServiceProviderEmailTemplateBookingActionByCitizen;

	public async update(subject: ISubject<any>): Promise<void> {
		if (subject instanceof BookingsSubject && subject.booking?.status !== BookingStatus.OnHold) {
			if (subject.booking.service.sendNotifications)
				await this.sendEmail(subject.booking, subject.bookingType, EmailRecipient.Citizen);
			if (subject.booking.service.sendNotificationsToServiceProviders)
				await this.sendEmail(subject.booking, subject.bookingType, EmailRecipient.ServiceProvider);
		}
	}

	private async sendEmail(booking: Booking, bookingType: BookingType, recipientType: EmailRecipient) {
		let body: EmailTemplateBase;
		let email: string;
		switch (recipientType) {
			case EmailRecipient.Citizen:
				body = await this.createCitizenEmailFactory(booking, bookingType);
				email = booking.citizenEmail;
				break;
			case EmailRecipient.ServiceProvider:
				body = await this.createServiceProviderEmailFactory(booking, bookingType);
				email = booking.serviceProvider?.email;
				break;
		}
		if (email) {
			const emailDetails = MailObserver.constructEmailTemplate(body, email);
			if (emailDetails?.html) await this.notificationsService.sendEmail(emailDetails);
			return;
		}
		logger.info(`Email not sent out for booking id (${booking.id}) as ${recipientType} email is not provided`);
	}

	private async createCitizenEmailFactory(booking: Booking, bookingType: BookingType): Promise<EmailTemplateBase> {
		const currentUser = await this.userContext.getCurrentUser();
		const userIsAdmin = currentUser.isAdmin() || currentUser.isAgency();
		const templates = userIsAdmin
			? this.citizenEmailTemplateBookingActionByServiceProvider
			: this.citizenEmailTemplateBookingActionByCitizen;
		return this.templateFactory(booking, bookingType, templates);
	}

	private async createServiceProviderEmailFactory(
		booking: Booking,
		bookingType: BookingType,
	): Promise<EmailTemplateBase> {
		const currentUser = await this.userContext.getCurrentUser();
		const userIsAdmin = currentUser.isAdmin() || currentUser.isAgency();
		const templates = userIsAdmin
			? this.serviceProviderEmailTemplateBookingActionByServiceProvider
			: this.serviceProviderEmailTemplateBookingActionByCitizen;
		return this.templateFactory(booking, bookingType, templates);
	}

	private async templateFactory(
		data: Booking,
		bookingType: BookingType,
		templates: EmailBookingTemplate,
	): Promise<EmailTemplateBase | undefined> {
		switch (bookingType) {
			case BookingType.Created:
				return await templates.CreatedBookingEmail(data);
			case BookingType.Updated:
				return await templates.UpdatedBookingEmail(data);
			case BookingType.CancelledOrRejected:
				return await templates.CancelledBookingEmail(data);
			default:
				return;
		}
	}

	private static constructEmailTemplate(emailTemplate: EmailTemplateBase | undefined, email: string): MailOptions {
		return {
			to: [email],
			subject: emailTemplate?.subject,
			html: emailTemplate?.html,
		};
	}
}
