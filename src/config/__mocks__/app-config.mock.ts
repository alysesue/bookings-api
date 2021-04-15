export const getConfigMock = () => ({
	name: 'name',
	version: 'version',
	port: 'port',
	logQueries: 'logQueries',
	isLocal: false,
	isAutomatedTest: false,
	env: 'env',
	bookingEnv: 'bookingEnv',
	encryptionKey: 'encryptionKey',
	csrfSecret: 'csrfSecret',
	database: {
		host: 'host',
		port: 'port',
		instance: 'instance',
		username: 'username',
		// tslint:disable-next-line:no-hardcoded-credentials
		password: 'password',
	},
	molAdminAuthForwarder: {
		url: 'url',
	},
	recaptchaApiKey: 'recaptchaApiKey',
	recaptchaProjectId: 'recaptchaProjectId',
	recaptchaSiteKey: 'recaptchaSiteKey',
	hashIdSalt: 'hashIdSalt',
	accessControlAllowOrigin: 'accessControlAllowOrigin',
	mailer: {
		smtpHost: 'smtpHost',
		smtpPort: 'smtpPort',
		smtpSecure: 'smtpSecure',
		smtpUseAuth: 'smtpUseAuth',
		smtpAuthUsername: 'smtpAuthUsername',
		smtpAuthPassword: 'smtpAuthPassword',
	},

	email: {
		mol: {
			sender: 'sender',
		},
	},
});
