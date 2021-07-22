import { emailMapper, mapVariablesValuesToServiceTemplate } from '../notifications.mapper';
import { EmailBookingTemplate, EmailTemplateBase } from './citizen.mail';
import { EmailNotificationTemplateType } from '../../../enums/notifications';
import { ServiceNotificationTemplateService } from '../../serviceNotificationTemplate/serviceNotificationTemplate.service';
import { Inject } from 'typescript-ioc';

export class ServiceProviderEmailTemplateBookingActionByCitizen implements EmailBookingTemplate {
	@Inject
	public templateService: ServiceNotificationTemplateService;

	public async CreatedBookingEmail(data): Promise<EmailTemplateBase> {
		const {
			serviceName,
			spNameDisplayedForServiceProvider,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		let emailContent;
		let serviceEmailTemplate = '';
		const templateType = EmailNotificationTemplateType.CreatedByCitizenSentToServiceProvider;
		const serviceTemplate = await this.templateService.getEmailServiceNotificationTemplateByType(
			data.serviceId,
			templateType,
		);
		if (serviceTemplate) {
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		}
		if (serviceEmailTemplate) {
			emailContent = mapVariablesValuesToServiceTemplate(emailMapper(data), serviceEmailTemplate);
		} else {
			emailContent = `<pre>
You have received a new booking request.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForServiceProvider}.</b>
<br />
Below is a summary of the booking request details.
<br/>
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`;
		}

		return {
			subject: `BookingSG request: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const {
			serviceName,
			spNameDisplayedForServiceProvider,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		let emailContent;
		let serviceEmailTemplate = '';
		const templateType = EmailNotificationTemplateType.UpdatedByCitizenSentToServiceProvider;
		const serviceTemplate = await this.templateService.getEmailServiceNotificationTemplateByType(
			data.serviceId,
			templateType,
		);
		if (serviceTemplate) {
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		}
		if (serviceEmailTemplate) {
			emailContent = mapVariablesValuesToServiceTemplate(emailMapper(data), serviceEmailTemplate);
		} else {
			emailContent = `<pre>
There has been an update to the following booking by the other party.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForServiceProvider}.</b>
<br />
Below is a confirmation of the updated booking details.
<br/>
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`;
		}

		return {
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const {
			serviceName,
			spNameDisplayedForServiceProvider,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		let emailContent;
		let serviceEmailTemplate = '';
		const templateType = EmailNotificationTemplateType.CancelledByCitizenSentToServiceProvider;
		const serviceTemplate = await this.templateService.getEmailServiceNotificationTemplateByType(
			data.serviceId,
			templateType,
		);
		if (serviceTemplate) {
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		}
		if (serviceEmailTemplate) {
			emailContent = mapVariablesValuesToServiceTemplate(emailMapper(data), serviceEmailTemplate);
		} else {
			emailContent = `<pre>
The following booking has been cancelled by the other party.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForServiceProvider}.</b>
<br />
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`;
		}

		return {
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}
}

export class ServiceProviderEmailTemplateBookingActionByServiceProvider implements EmailBookingTemplate {
	@Inject
	public templateService: ServiceNotificationTemplateService;

	public async UpdatedBookingEmail(data): Promise<EmailTemplateBase> {
		const {
			serviceName,
			spNameDisplayedForServiceProvider,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		let emailContent;
		let serviceEmailTemplate = '';
		const templateType = EmailNotificationTemplateType.UpdatedByServiceProviderSentToServiceProvider;
		const serviceTemplate = await this.templateService.getEmailServiceNotificationTemplateByType(
			data.serviceId,
			templateType,
		);
		if (serviceTemplate) {
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		}
		if (serviceEmailTemplate) {
			emailContent = mapVariablesValuesToServiceTemplate(emailMapper(data), serviceEmailTemplate);
		} else {
			emailContent = `<pre>
You have updated a booking.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForServiceProvider}.</b>
<br />
Below is a summary of your updated booking details.
<br/>
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`;
		}

		return {
			subject: `BookingSG update: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public async CancelledBookingEmail(data): Promise<EmailTemplateBase> {
		const {
			serviceName,
			spNameDisplayedForServiceProvider,
			status,
			day,
			time,
			locationText,
			videoConferenceUrl,
		} = emailMapper(data);

		let emailContent;
		let serviceEmailTemplate = '';
		const templateType = EmailNotificationTemplateType.CancelledByServiceProviderSentToServiceProvider;
		const serviceTemplate = await this.templateService.getEmailServiceNotificationTemplateByType(
			data.serviceId,
			templateType,
		);
		if (serviceTemplate) {
			serviceEmailTemplate = serviceTemplate.htmlTemplate;
		}
		if (serviceEmailTemplate) {
			emailContent = mapVariablesValuesToServiceTemplate(emailMapper(data), serviceEmailTemplate);
		} else {
			emailContent = `<pre>
You have cancelled the following booking.
<br />
Booking for: <b>${serviceName}${spNameDisplayedForServiceProvider}.</b>
<br />
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${videoConferenceUrl}
${locationText}
</pre>`;
		}

		return {
			subject: `BookingSG cancellation: ${serviceName}${spNameDisplayedForServiceProvider}`,
			html: emailContent,
		};
	}

	public CreatedBookingEmail(_data): Promise<EmailTemplateBase> {
		return undefined;
	}
}
