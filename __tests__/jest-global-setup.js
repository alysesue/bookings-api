module.exports = () => {
	process.env.TZ = 'Asia/Singapore';
	process.env.FUNCTIONAL_TEST_BASE_URL = 'http://localhost:3999/bookingsg/api/v1';

	process.env.IS_LOCAL='true'
	process.env.LOG_QUERIES='true'
	process.env.IS_FUNCTIONAL_TEST='true'
	process.env.NODE_ENV='production'
	process.env.PORT='3000'
	process.env.BOOKINGSG_DB_HOST='gt_postgres'
	process.env.BOOKINGSG_DB_PORT='5432'
	process.env.BOOKINGSG_DB_INSTANCE='govtech'
	process.env.BOOKINGSG_DB_USERNAME='gtbooking'
	process.env.DB_PASSWORD_BOOKINGSG_APP='D8L6xJspQbvaUwukQLqd'
	process.env.RECAPTCHA_KEY_BOOKINGSG_APP=''
	process.env.ENCRYPTION_KEY_BOOKINGSG_APP='4O4wnTyfsSkz6uExCFyGILDWLONoEX4IXqVryvWuUdY='
	process.env.MOL_ADMIN_AUTH_FORWARDER_URL='https://www.dev.booking.gov.sg/admin-authforwarder'
};
