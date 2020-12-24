process.env.TZ = 'Asia/Singapore';

module.exports = () => {
	process.env.FUNCTIONAL_TEST_BASE_URL = 'http://localhost:3999/bookingsg/api/v1';
};
