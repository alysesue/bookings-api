module.exports = () => {
	process.env.TZ = 'Asia/Singapore';
	process.env.FUNCTIONAL_TEST_BASE_URL = 'http://localhost:3999/bookingsg/api/v1';
	process.env.BOOKINGSG_DB_PORT='5432';
	process.env.BOOKINGSG_DB_INSTANCE='govtech';
	process.env.BOOKINGSG_DB_USERNAME='gtbooking';
	process.env.DB_PASSWORD_BOOKINGSG_APP='D8L6xJspQbvaUwukQLqd';
};
