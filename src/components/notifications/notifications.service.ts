import { Inject, InRequestScope } from 'typescript-ioc';
import { getConfig } from '../../config/app-config';
import { CreateEmailResponseDataApiDomain } from 'mol-lib-api-contract/notification/mail/create-email/create-email-api-domain';
import { CreateEmail } from 'mol-lib-api-contract/notification/mail';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { mailer } from '../../config/mailer';
import { emailLogger } from '../../config/logger';
import { UserContext } from '../../infrastructure/auth/userContext';
import { MailOptions } from "./notifications.mapper";

@InRequestScope
export class NotificationsService {
	@Inject
	private userContext: UserContext;

	private config = getConfig();
	private defaultOptions = {
		from: this.config.email.mol.sender,
	};

	public async sendEmail(
		options: CreateEmail.Domain.CreateEmailRequestApiDomain,
	): Promise<CreateEmailResponseDataApiDomain> {
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
