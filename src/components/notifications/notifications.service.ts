import { InRequestScope } from 'typescript-ioc';
import { getConfig } from '../../config/app-config';
import {
	CreateEmailRequestApiDomain,
	CreateEmailResponseDataApiDomain,
} from 'mol-lib-api-contract/notification/mail/create-email/create-email-api-domain';
import { BookingStatus } from '../../models';
import { DateHelper } from '../../infrastructure/dateHelper';
import { CreateEmail } from 'mol-lib-api-contract/notification/mail';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { mailer } from '../../config/mailer';
import { emailLogger } from '../../config/logger';
import { MailOptions } from './MailOptions';

@InRequestScope
export class NotificationsService {
	private config = getConfig();
	private defaultOptions = {
		from: this.config.email.mol.sender,
	};

	public sendEmail = async (options: CreateEmail.Domain.CreateEmailRequestApiDomain) => {
		const mergedOptions = this.getMergedOptions(options);
		this.validateEmails(this.getEmailsFromOptions(mergedOptions, true));
		const recipients = options.to.join(',');

		try {
			const info = await mailer.sendMail({ ...mergedOptions, to: recipients });
			if (info.rejected.length > 0) {
				emailLogger.error('Nodemailer error', info);
				throw new MOLErrorV2(ErrorCodeV2.SYS_GENERIC).setResponseData(info);
			}

			const { accepted, rejected, messageId } = info;
			emailLogger.info(`Successfully sent email with messageId ${messageId}`);

			return new CreateEmailResponseDataApiDomain({ accepted, rejected, messageId });
		} catch (err) {
			emailLogger.warn(`Failed to send email to ${recipients}`, err);

			return new CreateEmailResponseDataApiDomain({
				accepted: err.responseData.accepted,
				rejected: err.responseData.rejected,
				messageId: err.responseData.messageId,
			});
		}
	};

	// data = subject.booking
	public static templateEmailBooking(data): CreateEmailRequestApiDomain {
		const status = BookingStatus[data._status];
		const serviceName = data._service?._name || '';
		const serviceProviderName = data._serviceProvider?._name;
		const serviceProviderText = serviceProviderName ? ` - ${serviceProviderName}` : '';
		const citizenEmail = data._citizenEmail;
		const location = data._location;
		const locationText = location ? `Location: <b>${location}</b>` : '';
		const day = DateHelper.getDateFormat(data._startDateTime);
		const time = `${DateHelper.getTime12hFormatString(data._startDateTime)} - ${DateHelper.getTime12hFormatString(
			data._endDateTime,
		)}`;
		return {
			to: [citizenEmail],
			subject: `BookingSG confirmation: ${serviceName}${serviceProviderText}`,
			html: `<pre>
Your booking request has been received.
<br />
Booking for: ${serviceName}${serviceProviderText}.
<br />
Below is a confirmation of your booking details.
Booking status: <b>${status}</b>
Date: <b>${day}</b>
Time: <b>${time}</b>
${locationText}
				</pre>`,
		};
	}

	private getMergedOptions = (options: MailOptions) => {
		return {
			...this.defaultOptions,
			...options,
		};
	};

	private getEmailsFromOptions = (options: MailOptions, forMultipleRecipients: boolean) => {
		if (forMultipleRecipients) {
			return [options.from, ...(options.to as string[])];
		}

		return [options.from, options.to as string];
	};

	private validateEmails = (emails: string[]) => {
		emails.forEach((email) => this.validateEmail(email));
	};

	private validateEmail = (value): void => {
		// tslint:disable-next-line: tsr-detect-unsafe-regexp
		if (!/^\w+((\-|\.)\w+)*\@\w+(\-\w+)*(\.\w{2,})*\.\w{2,}$/.test(value)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Invalid email address');
		}
	};
}
