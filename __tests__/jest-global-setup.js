module.exports = () => {
	process.env.TZ = 'Asia/Singapore';
	process.env.FUNCTIONAL_TEST_BASE_URL = 'http://localhost:3999/bookingsg/api/v1';

	// tslint:disable-next-line: no-console
	console.log('\n********** process.env **********\n', JSON.stringify(process.env, null, ' '));
};
