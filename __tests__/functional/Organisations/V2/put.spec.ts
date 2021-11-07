import { PgClient } from '../../../utils/pgClient';
import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { IdHasherForFunctional } from '../../../utils/idHashingUtil';
import { populateServiceAndServiceProvider } from '../../../populate/V2/servieProviders';

describe('Organisations functional tests - put', () => {
	const pgClient = new PgClient();
	const organisationName = 'localorg';
	const idHasher = new IdHasherForFunctional();
	let organisationId;
	let signedOrganisationId;

	beforeAll(async () => {
		await pgClient.cleanAllTables();
	});

	beforeEach(async () => {
		await pgClient.cleanAllTables();
		await pgClient.setOrganisation({ organisationName });
		organisationId = await pgClient.getFirstOrganisationId();
		await pgClient.mapOrganisation({ organisationId, organisationName });
		signedOrganisationId = await idHasher.convertIdToHash(organisationId);
	});

	afterAll(async () => {
		await pgClient.close();
	});

	it('should set organisation level schedule form', async () => {
		await populateServiceAndServiceProvider({
			organisation: organisationName,
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

		const response = await OrganisationAdminRequestEndpointSG.create({}).put(
			`/organisations/${signedOrganisationId}/scheduleForm`,
			{ body: schedule },
			'V2',
		);

		expect(response.statusCode).toBe(204);
	});
});
