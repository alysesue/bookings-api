import {PgClient} from "../../../utils/pgClient";
import {OrganisationAdminRequestEndpointSG} from "../../../utils/requestEndpointSG";

describe('Organisations functional tests - put', () => {
    const pgClient = new PgClient();
    const organisationName = 'localorg';

    beforeAll(async(done) => {
        await pgClient.cleanAllTables();
        done();
    });

    beforeEach(async(done) => {
        await pgClient.cleanAllTables();
        await pgClient.setOrganisation({organisationName});
        done()
    });

    afterAll(async(done) => {
        await pgClient.close();
        done();
    });

    it('should set organisation level schedule form', async() => {
        const organisationId = await pgClient.getFirstOrganisation();
        const openTime = '09:00';
        const closeTime = '10:00';
        const scheduleSlot = 60;

        const schedule = {
                    slotsDurationInMin: scheduleSlot,
                    weekdaySchedules: [
                        {
                            weekday: 0,
                            hasScheduleForm: true,
                            breaks: [],
                            closeTime,
                            openTime,
                        },
                        {
                            weekday: 1,
                            hasScheduleForm: true,
                            breaks: [],
                            closeTime,
                            openTime,
                        },
                        {
                            weekday: 2,
                            hasScheduleForm: true,
                            breaks: [],
                            closeTime,
                            openTime,
                        },
                        {
                            weekday: 3,
                            hasScheduleForm: true,
                            breaks: [],
                            closeTime,
                            openTime,
                        },
                        {
                            weekday: 4,
                            hasScheduleForm: true,
                            breaks: [],
                            closeTime,
                            openTime,
                        },
                        {
                            weekday: 5,
                            hasScheduleForm: true,
                            breaks: [],
                            closeTime,
                            openTime,
                        },
                        {
                            weekday: 6,
                            hasScheduleForm: true,
                            breaks: [],
                            closeTime,
                            openTime,
                        },
                    ],
            };

        const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/organisations/${organisationId}/scheduleForm`, {body: schedule});

        expect(response.statusCode).toBe(204);
    });

});
