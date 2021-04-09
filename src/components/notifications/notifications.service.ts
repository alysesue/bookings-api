import { InRequestScope } from 'typescript-ioc';
import { getConfig } from '../../config/app-config';
import { post } from '../../tools/fetch';
import { CreateEmailRequestApiDomain } from 'mol-lib-api-contract/notification/mail/create-email/create-email-api-domain';
import {
	CitizenEmailTemplateBookingActionByCitizen,
	CitizenEmailTemplateBookingActionByServiceProvider,
	ServiceProviderEmailTemplateBookingActionByCitizen, ServiceProviderEmailTemplateBookingActionByServiceProvider
} from './emailTemplates';
import { BookingType } from '../../models/bookingType';

@InRequestScope
export class NotificationsService {
	private config = getConfig();
	public async sendEmail(body: CreateEmailRequestApiDomain): Promise<void> {
		const path = `${this.config.molNotification.url}/email/api/v1/send`;
		if (!this.config.isAutomatedTest) {
			await post(path, body, { ['mol-auth-type']: 'SYSTEM' });
		}
	}

	public createCitizenEmailFactory(data): CreateEmailRequestApiDomain {
		if (data._bookingType === BookingType.Created && data._userType._singPassUser)
			return CitizenEmailTemplateBookingActionByCitizen.CreatedBookingEmail(data);
		if (data._bookingType === BookingType.Updated && data._userType._singPassUser)
			return CitizenEmailTemplateBookingActionByCitizen.UpdatedBookingEmail(data);
		if (data._bookingType === BookingType.CancelledOrRejected && data._userType._singPassUser)
			return CitizenEmailTemplateBookingActionByCitizen.CancelledBookingEmail(data);
		if (data._bookingType === BookingType.Created && data._userType._adminUser)
			return CitizenEmailTemplateBookingActionByServiceProvider.CreatedBookingEmail(data);
		if (data._bookingType === BookingType.Updated && data._userType._adminUser)
			return CitizenEmailTemplateBookingActionByServiceProvider.UpdatedBookingEmail(data);
		if (data._bookingType === BookingType.CancelledOrRejected && data._userType._adminUser)
			return CitizenEmailTemplateBookingActionByServiceProvider.CancelledBookingEmail(data)
	}

	public createServiceProviderEmailFactory(data): CreateEmailRequestApiDomain {
		if (data._bookingType === BookingType.Created && data._userType._singPassUser)
			return ServiceProviderEmailTemplateBookingActionByCitizen.CreatedBookingEmail(data);
		if (data._bookingType === BookingType.Updated && data._userType._singPassUser)
			return ServiceProviderEmailTemplateBookingActionByCitizen.UpdatedBookingEmail(data);
		if (data._bookingType === BookingType.CancelledOrRejected && data._userType._singPassUser)
			return ServiceProviderEmailTemplateBookingActionByCitizen.CancelledBookingEmail(data);
		if (data._bookingType === BookingType.Updated && data._userType._adminUser)
			return ServiceProviderEmailTemplateBookingActionByServiceProvider.UpdatedBookingEmail(data);
		if (data._bookingType === BookingType.CancelledOrRejected && data._userType._adminUser)
			return ServiceProviderEmailTemplateBookingActionByServiceProvider.CancelledBookingEmail(data);
	}
}
