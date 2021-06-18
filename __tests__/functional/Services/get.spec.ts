import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';
import { populateService, populateServiceWithFields } from '../../populate/basic';
import { PartialAdditionalSettings, ServiceResponse } from '../../../src/components/services/service.apicontract';

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
		await populateService({ nameService: SERVICE_NAME });
		const response = await OrganisationAdminRequestEndpointSG.create({}).get('/services');
		expect(response.statusCode).toEqual(200);
		expect((response.body.data[0] as ServiceResponse).name).toEqual(SERVICE_NAME);
		expect((response.body.data[0] as ServiceResponse).isSpAutoAssigned).toEqual(false);
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

		await populateServiceWithFields({ nameService: SERVICE_NAME, additionalSettings });
		const response = await OrganisationAdminRequestEndpointSG.create({}).get('/services');
		expect(response.statusCode).toEqual(200);
		expect((response.body.data[0] as ServiceResponse).additionalSettings.isOnHold).toEqual(false);
		expect((response.body.data[0] as ServiceResponse).additionalSettings.isStandAlone).toEqual(false);
		expect((response.body.data[0] as ServiceResponse).additionalSettings.sendNotifications).toEqual(true);
		expect(
			(response.body.data[0] as ServiceResponse).additionalSettings.sendNotificationsToServiceProviders,
		).toEqual(true);
		expect((response.body.data[0] as ServiceResponse).additionalSettings.sendSMSNotifications).toEqual(false);
	});
});
