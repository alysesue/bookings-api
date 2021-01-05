import { ConfigUtils } from 'mol-lib-common/utils/config/ConfigUtils';

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
	encryptionKey: ConfigUtils.getValueFromEnv('ENCRYPTION_KEY_BOOKINGSG_APP'),
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
	recaptchaKey: ConfigUtils.getValueFromEnv('RECAPTCHA_KEY_BOOKINGSG_APP'),
});

export const basePath = '/bookingsg';
