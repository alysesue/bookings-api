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
import {
	CitizenEventEmailTemplateBookingActionByServiceProvider,
	CitizenEventEmailTemplateBookingActionByCitizen,
} from './templates/citizen.event.mail';
import {
	ServiceProviderEventEmailTemplateBookingActionByServiceProvider,
	ServiceProviderEventEmailTemplateBookingActionByCitizen,
} from './templates/serviceProviders.event.mail';

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
	@Inject
	private citizenEventEmailTemplateBookingActionByServiceProvider: CitizenEventEmailTemplateBookingActionByServiceProvider;
	@Inject
	private citizenEventEmailTemplateBookingActionByCitizen: CitizenEventEmailTemplateBookingActionByCitizen;
	@Inject
	private serviceProviderEventEmailTemplateBookingActionByServiceProvider: ServiceProviderEventEmailTemplateBookingActionByServiceProvider;
	@Inject
	private serviceProviderEventEmailTemplateBookingActionByCitizen: ServiceProviderEventEmailTemplateBookingActionByCitizen;

	public async update(subject: ISubject<any>): Promise<void> {
		if (!(subject instanceof BookingsSubject) || subject.booking?.status === BookingStatus.OnHold) {
			return;
		}

		switch (subject.bookingType) {
			case BookingType.ApprovedBySA:
				// When admin approves booking and release to SP, only send email to service provider
				if (subject.booking.service.sendNotificationsToServiceProviders)
					await this.sendEmail(subject.booking, subject.bookingType, EmailRecipient.ServiceProvider);
				break;
			case BookingType.Created:
				// When citizen creates booking with 2-step workflow flag, only send email to citizen and [service admin]
				if (subject.booking.status === BookingStatus.PendingApprovalSA) {
					if (subject.booking.service.sendNotifications) {
						await this.sendEmail(subject.booking, subject.bookingType, EmailRecipient.Citizen);
					}
					await this.sendEmail(subject.booking, subject.bookingType, EmailRecipient.ServiceAdmin);
					break;
				} // Else, fall through to default
			default:
				if (subject.booking.service.sendNotifications)
					await this.sendEmail(subject.booking, subject.bookingType, EmailRecipient.Citizen);
				if (subject.booking.service.sendNotificationsToServiceProviders)
					await this.sendEmail(subject.booking, subject.bookingType, EmailRecipient.ServiceProvider);
		}
	}

	private async sendEmail(booking: Booking, bookingType: BookingType, recipientType: EmailRecipient) {
		let body: EmailTemplateBase;
		let emails: string[] = [];
		switch (recipientType) {
			case EmailRecipient.Citizen:
				body = await this.createCitizenEmailFactory(booking, bookingType);
				if (booking.citizenEmail) {
					emails.push(booking.citizenEmail);
				}
				break;
			case EmailRecipient.ServiceProvider:
				body = await this.createServiceProviderEmailFactory(booking, bookingType);
				// For normal bookings
				if (!booking.eventId && booking.serviceProvider.email) {
					emails.push(booking.serviceProvider?.email);
				}

				// For event bookings
				if (booking.eventId) {
					booking.bookedSlots.map((slot) => {
						emails.push(slot.oneOffTimeslot.serviceProvider.email);
					});
					emails = [...new Set(emails)];
				}

				break;
			case EmailRecipient.ServiceAdmin:
				body = await this.createServiceProviderEmailFactory(booking, bookingType);
				emails = booking.service.adminUsers.map((adminUser) => adminUser.email);
				break;
		}
		emails.forEach(async (email) => {
			const emailDetails = MailObserver.constructEmailTemplate(body, email);
			if (emailDetails?.html) {
				await this.notificationsService.sendEmail(emailDetails);
			}
			return;
		});

		if (!emails.length) {
			logger.info(`Email not sent out for booking id (${booking.id}) as ${recipientType} email is not provided`);
		}
	}

	private async createCitizenEmailFactory(booking: Booking, bookingType: BookingType): Promise<EmailTemplateBase> {
		const currentUser = await this.userContext.getCurrentUser();
		const userIsAdmin = currentUser.isAdmin() || currentUser.isAgency();
		const actionBySPTemplate = booking.eventId
			? this.citizenEventEmailTemplateBookingActionByServiceProvider
			: this.citizenEmailTemplateBookingActionByServiceProvider;
		const actionByCitizenTemplate = booking.eventId
			? this.citizenEventEmailTemplateBookingActionByCitizen
			: this.citizenEmailTemplateBookingActionByCitizen;

		const templates = userIsAdmin ? actionBySPTemplate : actionByCitizenTemplate;
		return this.templateFactory(booking, bookingType, templates);
	}

	private async createServiceProviderEmailFactory(
		booking: Booking,
		bookingType: BookingType,
	): Promise<EmailTemplateBase> {
		const currentUser = await this.userContext.getCurrentUser();
		const userIsAdmin = currentUser.isAdmin() || currentUser.isAgency();
		const actionBySPTemplate = booking.eventId
			? this.serviceProviderEventEmailTemplateBookingActionByServiceProvider
			: this.serviceProviderEmailTemplateBookingActionByServiceProvider;
		const actionByCitizenTemplate = booking.eventId
			? this.serviceProviderEventEmailTemplateBookingActionByCitizen
			: this.serviceProviderEmailTemplateBookingActionByCitizen;

		const templates = userIsAdmin ? actionBySPTemplate : actionByCitizenTemplate;
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
			case BookingType.ApprovedBySA:
				return await templates.ApprovedBySABookingEmail(data);
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
