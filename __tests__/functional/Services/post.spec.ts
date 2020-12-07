import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';

describe('Tests endpoint and populate data', () => {
    const SERVICE_NAME = 'Service';
    const pgClient = new PgClient();

    beforeAll(async () => {
        await pgClient.cleanAllTables();
    });
    afterAll(async () => {
        await pgClient.close();
    });

    afterEach(async () => {
        await pgClient.cleanAllTables();
    });

    it('Post service', async () => {
        const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', { body: { name: SERVICE_NAME } });
        expect(response.statusCode).toEqual(200);
    });
});
