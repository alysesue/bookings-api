import { InRequestScope } from 'typescript-ioc';
import { getConfig } from '../../config/app-config';
import { post } from '../../tools/fetch';
import { CreateEmailRequestApiDomain } from 'mol-lib-api-contract/notification/mail/create-email/create-email-api-domain';
import {
	CitizenBookingCreatedTemplateBase,
	CitizenBookingUpdatedTemplateBase,
	CitizenBookingCancelledByCitizenTemplateBase,
	ServiceProviderBookingCreatedTemplateBase,
	ServiceProviderBookingUpdatedTemplateBase,
	ServiceProviderBookingCancelledBySPTemplateBase,
	CitizenBookingCancelledBySPTemplateBase,
	ServiceProviderBookingCancelledByCitizenTemplateBase,
} from './EmailTemplateFactory/emailTemplate.factory';
import { BookingType } from '../../models/bookingType';

@InRequestScope
export class NotificationsService {
	private config = getConfig();
	public async sendEmail(body1: CreateEmailRequestApiDomain, body2: CreateEmailRequestApiDomain): Promise<void> {
		const path = `${this.config.molNotification.url}/email/api/v1/send`;
		if (!this.config.isAutomatedTest) {
			await post(path, body1, { ['mol-auth-type']: 'SYSTEM' });
			await post(path, body2, { ['mol-auth-type']: 'SYSTEM' });
		}
	}

	public createEmail(data): [CreateEmailRequestApiDomain, CreateEmailRequestApiDomain?] {
		if (data._bookingType === BookingType.Created && data._userType._singPassUser)
			return [
				CitizenBookingCreatedTemplateBase.CitizenBookingCreatedEmail(data),
				ServiceProviderBookingCreatedTemplateBase.ServiceProviderBookingCreatedEmail(data),
			];
		if (data._bookingType === BookingType.Updated && data._userType._singPassUser)
			return [CitizenBookingUpdatedTemplateBase.CitizenBookingUpdatedEmail(data)];
		// TODO: add another email - what email do SP get when updated by citizen?
		if (data._bookingType === BookingType.CancelledOrRejected && data._userType._singPassUser)
			return [
				CitizenBookingCancelledByCitizenTemplateBase.CitizenBookingCancelledByCitizenEmail(data),
				ServiceProviderBookingCancelledByCitizenTemplateBase.ServiceProviderBookingCancelledByCitizenEmail(
					data,
				),
			];
		if (data._bookingType === BookingType.Created && data._userType._adminUser)
			return [ServiceProviderBookingCreatedTemplateBase.ServiceProviderBookingCreatedEmail(data)];
		// TODO: add another email - what email do citizens get when SP creates a booking, what email does SP get when they create booking (if any)
		if (data._bookingType === BookingType.Updated && data._userType._adminUser)
			return [
				ServiceProviderBookingUpdatedTemplateBase.ServiceProviderBookingUpdatedEmail(data),
				CitizenBookingUpdatedTemplateBase.CitizenBookingUpdatedEmail(data),
			];
		if (data._bookingType === BookingType.CancelledOrRejected && data._userType._adminUser)
			return [
				ServiceProviderBookingCancelledBySPTemplateBase.ServiceProviderBookingCancelledBySPEmail(data),
				CitizenBookingCancelledBySPTemplateBase.CitizenBookingCancelledBySPEmail(data),
			];
	}
}
