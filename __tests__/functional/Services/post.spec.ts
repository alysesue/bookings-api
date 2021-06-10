import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';

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

	it('Post service', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME },
		});
		expect(response.statusCode).toEqual(200);
	});

	it('Post service with labels', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME, labels: [{ label: 'name' }] },
		});
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.labels[0].label).toBe('name');
	});

	it('Post service with SP autoAssigned', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME, isSpAutoAssigned: true },
		});
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.isSpAutoAssigned).toBe(true);
	});

	it('Post service with video conference default URL', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME, videoConferenceUrl: 'http://www.zoom.us/1234567' },
		});
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.videoConferenceUrl).toBe('http://www.zoom.us/1234567');
	});

	it('Post service with invalid video conference default URL', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME, videoConferenceUrl: 'www.zoom.us/1234567' },
		});

		expect(response.body.data[0].code).toBe('10301');
		expect(response.body.data[0].message).toBe('Invalid URL');
		expect(response.body.errorCode).toBe('SYS_INVALID_PARAM');
		expect(response.body.errorMessage).toBe('One or more business validations failed');
	});

	it('should return additionalSettings default values in response when it is not set in Post request', async () => {
		const additionalSettingsDefaultValues = {
			allowAnonymousBookings: false,
			isOnHold: false,
			isStandAlone: false,
			sendNotifications: false,
			sendNotificationsToServiceProviders: false,
		};

		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME },
		});

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.additionalSettings).toEqual(additionalSettingsDefaultValues);
	});

	it('should return additionalSettings default values in response when it is set to empty in Post request', async () => {
		const additionalSettingsDefaultValues = {
			allowAnonymousBookings: false,
			isOnHold: false,
			isStandAlone: false,
			sendNotifications: false,
			sendNotificationsToServiceProviders: false,
		};

		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME, additionalSettings: {} },
		});

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.additionalSettings).toEqual(additionalSettingsDefaultValues);
	});

	it('should post ALL additionalSettings values and return them in response', async () => {
		const additionalSettingsValues = {
			allowAnonymousBookings: true,
			isOnHold: true,
			isStandAlone: true,
			sendNotifications: true,
			sendNotificationsToServiceProviders: true,
		};

		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME, additionalSettings: additionalSettingsValues },
		});

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.additionalSettings).toEqual(additionalSettingsValues);
	});

	it('should post part of the additionalSettings values and return ALL of them in response', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME, additionalSettings: {sendNotifications: true,
					sendNotificationsToServiceProviders: true} },
		});

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.additionalSettings).toEqual({
			allowAnonymousBookings: false,
			isOnHold: false,
			isStandAlone: false,
			sendNotifications: true,
			sendNotificationsToServiceProviders: true,
		});
	});

	it('Post service with invalid values in additionalSettings', async () => {
		const additionalSettingsValues = {
			allowAnonymousBookings: 'test anonymous',
			isOnHold: 'test onHold',
			isStandAlone: 'test standAlone',
			sendNotifications: 'test notif',
			sendNotificationsToServiceProviders: 'test notifSP',
		};

		const response = await OrganisationAdminRequestEndpointSG.create({}).post('/services', {
			body: { name: SERVICE_NAME, additionalSettings: additionalSettingsValues },
		});

		const responseData = response.body.data;
		const responseKey = 'request.request.additionalSettings';
		expect(response.statusCode).toEqual(400);
		expect(responseData[`${responseKey}.allowAnonymousBookings`].message).toBe('invalid boolean value');
		expect(responseData[`${responseKey}.isOnHold`].message).toBe('invalid boolean value');
		expect(responseData[`${responseKey}.isStandAlone`].message).toBe('invalid boolean value');
		expect(responseData[`${responseKey}.sendNotifications`].message).toBe('invalid boolean value');
		expect(responseData[`${responseKey}.sendNotificationsToServiceProviders`].message).toBe('invalid boolean value');
		expect(response.body.errorCode).toBe('SYS_INVALID_PARAM');
		// expect(response.body.errorMessage).toBe('One or more business validations failed');
	});
});
