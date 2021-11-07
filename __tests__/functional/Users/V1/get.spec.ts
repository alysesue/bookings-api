import { PgClient } from '../../../utils/pgClient';
import { AnonmymousEndpointSG } from '../../../utils/requestEndpointSG';

describe('Tests endpoint and populate data', () => {
	const pgClient = new PgClient();

	beforeEach(async () => {
		await pgClient.cleanAllTables();
	});
	afterAll(async () => {
		await pgClient.cleanAllTables();
		await pgClient.close();
	});

	it('should get anonymous user', async () => {
		const endpoint = await AnonmymousEndpointSG.create();
		const response = await endpoint.get('/users/me');

		expect(response.statusCode).toBe(200);
		expect(response.body.data.user.userType).toBe('anonymous');
	});
});
