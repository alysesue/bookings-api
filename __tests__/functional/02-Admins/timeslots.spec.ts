import {PgClient} from "../../utils/pgClient";
import {AdminRequestEndpointSG} from "../../utils/requestEndpointSG";
import { populateServiceAndServiceProvider} from "../../Populate/basic";

describe('Timeslots functional tests', () => {
    const pgClient = new PgClient();
    let result;

    beforeAll(async () => {
        await pgClient.cleanAllTables();
    });
    afterAll(async () => {
        await pgClient.close();
    });

    beforeEach(async () => {
        result = await populateServiceAndServiceProvider({});
    });

    afterEach(async () => {
        await pgClient.cleanAllTables();
    });

    it('should create and get timeslots for organisation admin', async() => {
        const createTimeslotsResponse = await AdminRequestEndpointSG.create({}).post(
            `/service-providers/${result.serviceProviderId}/timeslotSchedule/timeslots`,
            {
                body: {
                    weekDay: 0,
                    startTime: '01:00',
                    endTime: '02:00',
                    capacity: 1,
                },
            },
        );
        expect(createTimeslotsResponse.statusCode).toEqual(201);

        const getTimeslotsResponse = await AdminRequestEndpointSG.create({}).get(`/service-providers/${result.serviceProviderId}/timeslotSchedule`);
        expect(getTimeslotsResponse).toEqual(200);
    });
});
