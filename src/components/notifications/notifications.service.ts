import { InRequestScope } from 'typescript-ioc';
import { getConfig } from '../../config/app-config';
import { CreateEmailResponseDataApiDomain } from 'mol-lib-api-contract/notification/mail/create-email/create-email-api-domain';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { mailer } from '../../config/mailer';
import { emailLogger } from '../../config/logger';
import { MailOptions } from './notifications.mapper';

@InRequestScope
export class NotificationsService {
	private config = getConfig();
	private defaultOptions = {
		from: this.config.email.mol.sender,
	};

	public async sendEmail(options: MailOptions): Promise<CreateEmailResponseDataApiDomain> {
		const mergedOptions = this.getMergedOptions(options);
		this.validateEmails(this.getEmailsFromOptions(mergedOptions));
		const recipients = options.to.join(',');

		try {
			const info = await (await mailer()).sendMail({ ...mergedOptions, to: recipients });
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
	}

	private getMergedOptions = (options: MailOptions) => {
		return {
			...this.defaultOptions,
			...options,
		};
	};

	private getEmailsFromOptions = (options: MailOptions) => {
		return [options.from, ...options.to];
	};

	private validateEmails = (emails: string[]) => {
		emails.forEach((email) => this.validateEmail(email));
	};

	private validateEmail = (value): void => {
		// tslint:disable-next-line: tsr-detect-unsafe-regexp
		if (!/^\w+((\-|\.)\w+)*\@\w+(\-|\.|(\w+))*$/.test(value)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Invalid email address');
		}
	};
}
