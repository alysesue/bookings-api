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
			if (!subject.booking.service.sendNotifications) return;
			await this.emailBookingToCitizen(subject.booking, subject.bookingType);
			if (!subject.booking.service.sendNotificationsToServiceProviders) return;
			await this.emailBookingToServiceProvider(subject.booking, subject.bookingType);
		}
	}

	private async emailBookingToCitizen(booking: Booking, bookingType: BookingType): Promise<void> {
		const body = await this.createCitizenEmailFactory(booking, bookingType);
		const email = MailObserver.verifyEmail(booking.citizenEmail);
		const citizenEmailDetails = MailObserver.constructEmailTemplate(body, email);
		if (citizenEmailDetails?.html) await this.notificationsService.sendEmail(citizenEmailDetails);
	}

	private async emailBookingToServiceProvider(booking: Booking, bookingType: BookingType): Promise<void> {
		const serviceProviderEmailBody = await this.createServiceProviderEmailFactory(booking, bookingType);
		const email = MailObserver.verifyEmail(booking.serviceProvider?.email);
		const serviceProviderEmailDetails = MailObserver.constructEmailTemplate(serviceProviderEmailBody, email);
		if (serviceProviderEmailDetails?.html) await this.notificationsService.sendEmail(serviceProviderEmailDetails);
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

	private static constructEmailTemplate(emailTemplate: EmailTemplateBase | undefined, email: string): MailOptions {
		return {
			to: [email],
			subject: emailTemplate?.subject,
			html: emailTemplate?.html,
		};
	}

	private static verifyEmail(email: string | undefined): string {
		if (!email) throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Email not found`);
		return email;
	}
}
