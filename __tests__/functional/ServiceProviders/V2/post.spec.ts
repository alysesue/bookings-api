import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { PgClient } from '../../../utils/pgClient';
import { populateService } from '../../../populate/basicV2';

describe('Service providers functional tests - post', () => {
    const SP_NAME = 'sp';
    const SP_EMAIL = `${SP_NAME}@govtech.com`;
    const SP_PHONE = '+6580000000';
    const pgClient = new PgClient();
    let service;

    beforeAll(async (done) => {
        await pgClient.cleanAllTables();
        done();
    });

    afterAll(async (done) => {
        await pgClient.close();
        done();
    });

    beforeEach(async (done) => {
        service = await populateService({});
        done();
    });

    afterEach(async (done) => {
        await pgClient.cleanAllTables();
        done();
    });

    it('Post & Get serviceProvider', async () => {
        const portResponse = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).post(
            '/service-providers',
            {
                body: {
                    serviceProviders: [
                        {
                            name: SP_NAME,
                            email: SP_EMAIL,
                            phone: SP_PHONE,
                        },
                    ],
                },
            }, 'V2'
        );
        expect(portResponse.statusCode).toEqual(204);

        const getResponse = await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).get(
            '/service-providers', {}, 'V2'
        );
        expect(getResponse.statusCode).toEqual(200);
        expect(typeof getResponse.body.data[0].id).toBe("string");
        expect(getResponse.body.data[0].name).toEqual(SP_NAME);
        expect(getResponse.body.data[0].email).toEqual(SP_EMAIL);
        expect(getResponse.body.data[0].phone).toEqual(SP_PHONE);
    });
});
