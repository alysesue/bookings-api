import { emailLogger } from './logger';
import * as nodemailer from 'nodemailer';
import * as inLineCss from 'nodemailer-juice';
import { getConfig } from './app-config';
import { AsyncLazy } from '../tools/asyncLazy';

function createMailer(): Promise<any> {
	const config = getConfig();
	const smtp = {
		host: config?.mailer?.smtpHost,
		port: config?.mailer?.smtpPort,
		secure: config?.mailer?.smtpSecure,
		...(config?.mailer?.smtpUseAuth
			? {
				auth: {
					user: config?.mailer?.smtpAuthUsername,
					pass: config?.mailer?.smtpAuthPassword,
				},
			}
			: null),
		pool: true,
	};

	return new Promise<any>((resolve) => {
		const newMailer = nodemailer.createTransport(smtp).use('compile', inLineCss());

		newMailer.verify((err) => {
			if (err) {
				emailLogger.error('Unable to configure nodemailer SMTP transport', err);
			} else {
				emailLogger.info('Nodemailer SMTP configuration was succeessful');
			}
			resolve(newMailer);
		});
	});
}

const _mailer = new AsyncLazy(() => createMailer());

export const mailer = () => _mailer.getValue();
