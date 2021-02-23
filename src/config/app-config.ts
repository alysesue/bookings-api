import { ConfigUtils } from 'mol-lib-common';

const packageJSON = require('../../package.json');
require('dotenv').config();

export const getConfig = () => ({
	name: packageJSON.name,
	version: packageJSON.version,
	port: ConfigUtils.getIntValueFromEnv('PORT', 3000),
	logQueries: ConfigUtils.getValueFromEnv('LOG_QUERIES', 'false') === 'true',
	isLocal: ConfigUtils.getValueFromEnv('IS_LOCAL', 'false') === 'true',
	isAutomatedTest: ConfigUtils.getValueFromEnv('IS_AUTOMATED_TEST', 'false') === 'true',
	env: ConfigUtils.getValueFromEnv('NODE_ENV', 'production'),
	bookingEnv: ConfigUtils.getValueFromEnv('BOOKING_ENV', 'production'),
	encryptionKey: ConfigUtils.getValueFromEnv('ENCRYPTION_KEY_BOOKINGSG_APP'),
	csrfSecret: ConfigUtils.getValueFromEnv('CSRF_SECRET'),
	database: {
		host: ConfigUtils.getValueFromEnv('BOOKINGSG_DB_HOST'),
		port: ConfigUtils.getValueFromEnv('BOOKINGSG_DB_PORT'),
		instance: ConfigUtils.getValueFromEnv('BOOKINGSG_DB_INSTANCE'),
		username: ConfigUtils.getValueFromEnv('BOOKINGSG_DB_USERNAME'),
		password: ConfigUtils.getValueFromEnv('DB_PASSWORD_BOOKINGSG_APP'),
	},
	molAdminAuthForwarder: {
		url: ConfigUtils.getValueFromEnv('MOL_ADMIN_AUTH_FORWARDER_URL', ''),
	},
	recaptchaApiKey: ConfigUtils.getValueFromEnv('RECAPTCHA_API_KEY_BOOKINGSG_APP'),
	recaptchaProjectId: ConfigUtils.getValueFromEnv('RECAPTCHA_PROJECT_ID_BOOKINGSG_APP'),
	recaptchaSiteKey: ConfigUtils.getValueFromEnv('RECAPTCHA_SITE_KEY_BOOKINGSG_APP'),
	accessControlAllowOrigin: ConfigUtils.getValueFromEnv('ACCESS_CONTROL_ALLOW_ORIGIN'),
});

export const basePath = '/bookingsg';
