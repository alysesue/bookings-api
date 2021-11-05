import { emailMapper } from '../../notifications/notifications.mapper';
import { SMSmessage } from '../notificationSMS.service';

export abstract class SMSBookingTemplate {
	public abstract CreatedBookingSMS(data): SMSmessage;
	public abstract UpdatedBookingSMS(data): SMSmessage;
	public abstract CancelledBookingSMS(data): SMSmessage;
}

export class CitizenSMSTemplateBookingActionByCitizen implements SMSBookingTemplate {
	public CreatedBookingSMS(data): SMSmessage {
		const { serviceName, spNameDisplayedForCitizen, status, day, time, locationText, videoConferenceUrl } =
			emailMapper(data, true);

		return `
BookingSG confirmation: ${serviceName}${spNameDisplayedForCitizen}

Your booking request has been received.

Booking for: ${serviceName}${spNameDisplayedForCitizen}.

Below is a confirmation of your booking details.
Booking status: ${status}
Date: ${day}
Time: ${time}
${videoConferenceUrl}
${locationText}`;
	}

	public UpdatedBookingSMS(data): SMSmessage {
		const { serviceName, spNameDisplayedForCitizen, status, day, time, locationText, videoConferenceUrl } =
			emailMapper(data, true);
		return `
BookingSG update: ${serviceName}${spNameDisplayedForCitizen}

You have updated a booking.

Booking for: ${serviceName}${spNameDisplayedForCitizen}.

Below is a confirmation of your updated booking details.
Booking status: ${status}
Date: ${day}
Time: ${time}
${videoConferenceUrl}
${locationText}`;
	}

	public CancelledBookingSMS(data): SMSmessage {
		const { serviceName, spNameDisplayedForCitizen, status, day, time, locationText, videoConferenceUrl } =
			emailMapper(data, true);

		return `BookingSG cancellation: ${serviceName}${spNameDisplayedForCitizen}
		
You have cancelled the following booking.

Booking for: ${serviceName}${spNameDisplayedForCitizen}.

Booking status: ${status}
Date: ${day}
Time: ${time}
${videoConferenceUrl}
${locationText}`;
	}
}

export class CitizenSMSTemplateBookingActionByServiceProvider implements SMSBookingTemplate {
	public CreatedBookingSMS(data): SMSmessage {
		const { serviceName, spNameDisplayedForCitizen, status, day, time, locationText, videoConferenceUrl } =
			emailMapper(data, true);

		return `BookingSG confirmation: ${serviceName}${spNameDisplayedForCitizen}

A booking has been made.

Booking for: ${serviceName}${spNameDisplayedForCitizen}.

Below is a confirmation of your booking details.
Booking status: ${status}
Date: ${day}
Time: ${time}
${videoConferenceUrl}
${locationText}
`;
	}

	public UpdatedBookingSMS(data): SMSmessage {
		const { serviceName, spNameDisplayedForCitizen, status, day, time, locationText, videoConferenceUrl } =
			emailMapper(data, true);
		return `
			BookingSG update: ${serviceName}${spNameDisplayedForCitizen}

There has been an update to your booking confirmation.

Booking for: ${serviceName}${spNameDisplayedForCitizen}.

Below is a confirmation of your updated booking details.
Booking status: ${status}
Date: ${day}
Time: ${time}
${videoConferenceUrl}
${locationText}`;
	}

	public CancelledBookingSMS(data): SMSmessage {
		const { serviceName, spNameDisplayedForCitizen, status, day, time, locationText, videoConferenceUrl } =
			emailMapper(data, true);
		return `BookingSG cancellation: ${serviceName}${spNameDisplayedForCitizen}
		
The following booking has been cancelled by the other party.

Booking for: ${serviceName}${spNameDisplayedForCitizen}.

Booking status: ${status}
Date: ${day}
Time: ${time}
${videoConferenceUrl}
${locationText}`;
	}
}
