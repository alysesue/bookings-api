import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';
import { populateService } from '../../Populate/basic';

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

    it('Get service', async () => {
        await populateService({ nameService: SERVICE_NAME });
        const response = await OrganisationAdminRequestEndpointSG.create({}).get('/services');
        expect(response.statusCode).toEqual(200);
        expect(JSON.parse(response.body).data[0].name).toEqual(SERVICE_NAME);
    });
});
