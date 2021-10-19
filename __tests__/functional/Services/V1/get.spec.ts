import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { PgClient } from '../../../utils/pgClient';
import { PartialAdditionalSettings, ServiceResponseV1 } from '../../../../src/components/services/service.apicontract';
import { postService, postServiceWithFields } from '../../../populate/V1/services';

describe('Tests endpoint and populate data', () => {
	const SERVICE_NAME = 'Service';
	const pgClient = new PgClient();

	beforeAll(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});
	afterAll(async (done) => {
		await pgClient.close();
		done();
	});

	afterEach(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});

	it('Get service', async () => {
		await postService({ name: SERVICE_NAME });
		const response = await OrganisationAdminRequestEndpointSG.create({}).get('/services');
		expect(response.statusCode).toEqual(200);
		expect((response.body.data[0] as ServiceResponseV1).name).toEqual(SERVICE_NAME);
		expect((response.body.data[0] as ServiceResponseV1).isSpAutoAssigned).toEqual(false);
	});

	it('Get service with additional settings', async () => {
		const additionalSettings = {
			allowAnonymousBookings: false,
			isOnHold: false,
			isStandAlone: false,
			sendNotifications: true,
			sendNotificationsToServiceProviders: true,
			sendSMSNotifications: false,
		} as PartialAdditionalSettings;

		await postServiceWithFields({ name: SERVICE_NAME, additionalSettings });
		const response = await OrganisationAdminRequestEndpointSG.create({}).get('/services');
		expect(response.statusCode).toEqual(200);
		expect((response.body.data[0] as ServiceResponseV1).additionalSettings.isOnHold).toEqual(false);
		expect((response.body.data[0] as ServiceResponseV1).additionalSettings.isStandAlone).toEqual(false);
		expect((response.body.data[0] as ServiceResponseV1).additionalSettings.sendNotifications).toEqual(true);
		expect(
			(response.body.data[0] as ServiceResponseV1).additionalSettings.sendNotificationsToServiceProviders,
		).toEqual(true);
		expect((response.body.data[0] as ServiceResponseV1).additionalSettings.sendSMSNotifications).toEqual(false);
	});
});
