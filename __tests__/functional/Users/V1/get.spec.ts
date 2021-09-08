import { PgClient } from '../../../utils/pgClient';
import { AnonmymousEndpointSG } from '../../../utils/requestEndpointSG';

describe('Tests endpoint and populate data', () => {
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

	it('should get anonymous user', async () => {
		const endpoint = await AnonmymousEndpointSG.create();
		const response = await endpoint.get('/users/me');

		expect(response.statusCode).toBe(200);
		expect(response.body.data.user.userType).toBe('anonymous');
	});
});
