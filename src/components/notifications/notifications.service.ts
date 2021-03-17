import { InRequestScope } from 'typescript-ioc';
import { getConfig } from '../../config/app-config';
import { post } from '../../tools/fetch';
import { CreateEmailRequestApiDomain } from 'mol-lib-api-contract/notification/mail/create-email/create-email-api-domain';
import { BookingStatus } from '../../models';
import { DateHelper } from '../../infrastructure/dateHelper';

@InRequestScope
export class NotificationsService {
	private config = getConfig();
	public async sendEmail(body: CreateEmailRequestApiDomain): Promise<void> {
		const path = `${this.config.molNotification.url}/email/api/v1/send`;
		if (this.config.isLocal) {
			post(path, body, { ['mol-auth-type']: 'SYSTEM' });
		}
	}

	public static templateEmailBooking(data): CreateEmailRequestApiDomain {
		const status = BookingStatus[data._status];
		const serviceName = data._service._name;
		const serviceProviderName = data._serviceProvider._name;
		const citizenEmail = data._citizenEmail;
		const location = data._location;
		const locationLine = location ? `Location: <b>${location}</b>` : '';
		const day = DateHelper.getDateFormat(data._startDateTime);
		const time = `${DateHelper.getTime12hFormatString(data._startDateTime)} - ${DateHelper.getTime12hFormatString(
			data._endDateTime,
		)}`;
		return {
			to: [citizenEmail],
			subject: `BookingSG confirmation: ${serviceName} - ${serviceProviderName}`,
			html: `<pre>
Your booking request has been received.
<br />
Booking for: ${serviceName} - ${serviceProviderName}.
<br />
Below is a confirmation of your booking details.
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${locationLine}
				</pre>`,
		};
	}
}
