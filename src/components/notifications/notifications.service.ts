import { InRequestScope } from 'typescript-ioc';
import { getConfig } from '../../config/app-config';
import { CreateEmailResponseDataApiDomain } from 'mol-lib-api-contract/notification/mail/create-email/create-email-api-domain';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
// import { mailer } from '../../config/mailer';
import { emailLogger } from '../../config/logger';
import { MailOptions } from './notifications.mapper';
import { isEmail } from 'mol-lib-api-contract/utils';
import axios from 'axios';

@InRequestScope
export class NotificationsService {
	private config = getConfig();
	private defaultOptions = {
		from: this.config.email.mol.sender,
	};

	public async sendEmail(options: MailOptions): Promise<CreateEmailResponseDataApiDomain> {
		const mergedOptions = this.getMergedOptions(options);
		await this.validateEmails(this.getEmailsFromOptions(mergedOptions));
		const recipients = options.to.join(',');

		try {
			const { data } = await axios.request({
				method: 'post',
				url: this.config.runtimeInjectedVariables.nodemailerEndpoint,
				data: JSON.stringify({ ...mergedOptions, to: recipients }),
				headers: { 'x-api-key': this.config.runtimeInjectedVariables.awsApigatewayApiKey },
			});
			const info = JSON.parse(data);

			if (info.rejected.length > 0) {
				emailLogger.error('Nodemailer error', info);
				throw new MOLErrorV2(ErrorCodeV2.SYS_GENERIC).setResponseData(info);
			}

			const { accepted, rejected, messageId } = info;
			emailLogger.info(`Successfully sent email with messageId ${messageId}`);

			return new CreateEmailResponseDataApiDomain({ accepted, rejected, messageId });
		} catch (err) {
			const errObj = JSON.parse(err as string);
			emailLogger.warn(`Failed to send email to ${recipients}`, errObj);

			return new CreateEmailResponseDataApiDomain({
				accepted: errObj.responseData.accepted,
				rejected: errObj.responseData.rejected,
				messageId: errObj.responseData.messageId,
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

	private validateEmails = async (emails: string[]) => {
		await Promise.all(emails.map((email) => this.validateEmail(email)));
	};

	private validateEmail = async (email: string): Promise<void> => {
		if (!(await isEmail(email.toLowerCase())).pass) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Invalid email address');
		}
	};
}
