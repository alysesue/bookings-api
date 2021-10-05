import {PgClient} from "../../../utils/pgClient";
import {OrganisationAdminRequestEndpointSG} from "../../../utils/requestEndpointSG";
import {populateServiceAndServiceProvider} from "../../../populate/basicV1";

describe('Organisations functional tests - put', () => {
    const pgClient = new PgClient();
    const organisationName = 'localorg';
    let organisationId = undefined;

	beforeAll(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});

    beforeEach(async(done) => {
        await pgClient.cleanAllTables();
        await pgClient.setOrganisation({organisationName});
        organisationId = await pgClient.getFirstOrganisationId();
        await pgClient.mapOrganisation({organisationId, organisationName});
        done()
    });

	afterAll(async (done) => {
		await pgClient.close();
		done();
	});

    it('should set organisation level schedule form', async() => {
        await populateServiceAndServiceProvider({
            organisation: 'localorg',
            nameService: 'admin',
            serviceProviderName: 'sp',
            labels: [],
        });

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

		const response = await OrganisationAdminRequestEndpointSG.create(
			{},
		).put(`/organisations/${organisationId}/scheduleForm`, { body: schedule });

		expect(response.statusCode).toBe(204);
	});
});
