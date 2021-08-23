import { AnonmymousEndpointSG, TOKEN_COOKIE } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';

describe('User Session endpoints', () => {
	const pgClient = new PgClient();

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});
	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	it('Post anonymous user', async () => {
		const response = await AnonmymousEndpointSG.postAnonymousSession();
		const cookie = response.headers['set-cookie'];

		expect(response.statusCode).toEqual(204);
		expect(cookie && cookie.length > 0).toBeTruthy();

		const token = AnonmymousEndpointSG.parseBookingSGCookie(response, TOKEN_COOKIE);
		expect(token).toBeDefined();
	});
});
