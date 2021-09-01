require('dotenv').config();
import { ConfigUtils } from 'mol-lib-common';
import { MessageQueue } from 'mol-lib-common/message-queue/MessageQueue';
const packageJSON = require('../../package.json');

export const getConfig = () => ({
	name: packageJSON.name,
	version: packageJSON.version,
	port: ConfigUtils.getIntValueFromEnv('PORT', 3000),
	logQueries: ConfigUtils.getValueFromEnv('LOG_QUERIES', 'false') === 'true',
	isLocal: ConfigUtils.getValueFromEnv('IS_LOCAL', 'false') === 'true',
	otpEnabled: ConfigUtils.getValueFromEnv('OTP_ENABLED', 'true') === 'true',
	smsEnabled: ConfigUtils.getValueFromEnv('SMS_ENABLED', 'true') === 'true',
	isAutomatedTest: ConfigUtils.getValueFromEnv('IS_AUTOMATED_TEST', 'false') === 'true',
	env: ConfigUtils.getValueFromEnv('NODE_ENV', 'production'),
	bookingEnv: ConfigUtils.getValueFromEnv('BOOKING_ENV', 'production'),
	encryptionKey: ConfigUtils.getValueFromEnv('ENCRYPTION_KEY_BOOKINGSG_APP'),
	csrfSecret: ConfigUtils.getValueFromEnv('CSRF_SECRET'),
	database: {
		host: ConfigUtils.getValueFromEnv('DB_HOST'),
		port: ConfigUtils.getValueFromEnv('DB_PORT'),
		instance: ConfigUtils.getValueFromEnv('DB_INSTANCE'),
		username: ConfigUtils.getValueFromEnv('DB_USERNAME'),
		password: ConfigUtils.getValueFromEnv('DB_PASSWORD'),
	},
	molAdminAuthForwarder: {
		url: ConfigUtils.getValueFromEnv('MOL_ADMIN_AUTH_FORWARDER_URL', ''),
	},
	molNotification: {
		url: ConfigUtils.getValueFromEnv('MOL_NOTIFICATION_URL', ''),
	},
	molRouteMyInfo: {
		url: ConfigUtils.getValueFromEnv('MOL_ROUTES_MYINFO', ''),
	},
	mqConfig: {
		hosts: Object.values(ConfigUtils.getValueObjectFromEnv('MQ_HOST')),
		port: ConfigUtils.getIntValueFromEnv('MQ_PORT'),
		transport: ConfigUtils.getValueFromEnv('MQ_TRANSPORT'),
		username: ConfigUtils.getValueFromEnv('MQ_USERNAME'),
		password: ConfigUtils.getValueFromEnv('MQ_PASSWORD'),
		idle_time_out: 86400000,
	} as MessageQueue.Config,
	recaptchaApiKey: ConfigUtils.getValueFromEnv('RECAPTCHA_API_KEY_BOOKINGSG_APP'),
	recaptchaProjectId: ConfigUtils.getValueFromEnv('RECAPTCHA_PROJECT_ID_BOOKINGSG_APP'),
	recaptchaSiteKey: ConfigUtils.getValueFromEnv('RECAPTCHA_SITE_KEY_BOOKINGSG_APP'),
	hashIdSalt: ConfigUtils.getValueFromEnv('BOOKINGSG_HASHID_SALT'),
	accessControlAllowOrigin: ConfigUtils.getValueFromEnv('ACCESS_CONTROL_ALLOW_ORIGIN'),
	appURL: ConfigUtils.getValueFromEnv('APP_URL'),
	mailer: {
		smtpHost: ConfigUtils.getValueFromEnv('SMTP_HOST', ''),
		smtpPort: ConfigUtils.getValueFromEnv('SMTP_PORT', ''),
		smtpSecure: ConfigUtils.getBooleanValueFromEnv('SMTP_SECURE', true),
		smtpUseAuth: ConfigUtils.getBooleanValueFromEnv('SMTP_USE_AUTH', true),
		smtpAuthUsername: ConfigUtils.getValueFromEnv('SMTP_USERNAME', ''),
		smtpAuthPassword: ConfigUtils.getValueFromEnv('SMTP_PASSWORD', ''),
	},
	featureFlag: {
		lifeSGSync: ConfigUtils.getValueFromEnv('LIFESG_SYNC', 'false') === 'true',
	},
	email: {
		mol: {
			sender: ConfigUtils.getValueFromEnv('MOL_SENDER_EMAIL', ''),
		},
	},
});

export const basePath = '/bookingsg';
