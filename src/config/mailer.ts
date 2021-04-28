import { emailLogger } from './logger';
import * as nodemailer from 'nodemailer';
import * as inLineCss from 'nodemailer-juice';
import { getConfig } from './app-config';

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

export const mailer = nodemailer.createTransport(smtp).use('compile', inLineCss());

mailer.verify((err) => {
	if (err) {
		emailLogger.error('Unable to configure nodemailer SMTP transport', err);
	} else {
		emailLogger.info('Nodemailer SMTP configuration was succeessful');
	}
});
