import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { PgClient } from '../../../utils/pgClient';
import { PartialAdditionalSettings, ServiceResponseV2 } from '../../../../src/components/services/service.apicontract';
import { postService, postServiceWithFields } from '../../../populate/V2/services';

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
		await postService({ name: SERVICE_NAME });
		const response = await OrganisationAdminRequestEndpointSG.create({}).get('/services', {}, 'V2');
		expect(response.statusCode).toEqual(200);
		expect(typeof response.body.data[0].id).toBe('string');
		expect((response.body.data[0] as ServiceResponseV2).name).toEqual(SERVICE_NAME);
		expect((response.body.data[0] as ServiceResponseV2).isSpAutoAssigned).toEqual(false);
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
		const response = await OrganisationAdminRequestEndpointSG.create({}).get('/services', {}, 'V2');
		expect(response.statusCode).toEqual(200);
		expect((response.body.data[0] as ServiceResponseV2).additionalSettings.isOnHold).toEqual(false);
		expect((response.body.data[0] as ServiceResponseV2).additionalSettings.isStandAlone).toEqual(false);
		expect((response.body.data[0] as ServiceResponseV2).additionalSettings.sendNotifications).toEqual(true);
		expect(
			(response.body.data[0] as ServiceResponseV2).additionalSettings.sendNotificationsToServiceProviders,
		).toEqual(true);
		expect((response.body.data[0] as ServiceResponseV2).additionalSettings.sendSMSNotifications).toEqual(false);
	});
});
