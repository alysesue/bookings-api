import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';
import { populateService } from '../../Populate/basic';

describe('Tests endpoint and populate data', () => {
    const SERVICE_NAME = 'Service';
    const SERVICE_NAME_UPDATED = 'ServiceUpdated';
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

    it("should update first service's name", async () => {
        const service = await populateService({ nameService: SERVICE_NAME });

        const response2 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
            body: { name: SERVICE_NAME_UPDATED },
        });
        expect(response2.statusCode).toEqual(200);

        const response3 = await OrganisationAdminRequestEndpointSG.create({}).get('/services');
        expect(response3.statusCode).toEqual(200);
        expect(JSON.parse(response3.body).data[0].name).toEqual(SERVICE_NAME_UPDATED);
    });
});
