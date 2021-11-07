import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { PgClient } from '../../../utils/pgClient';

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

	it('Post service', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post(
			'/services',
			{
				body: { name: SERVICE_NAME },
			},
			'V2',
		);
		expect(response.statusCode).toEqual(200);
		expect(typeof response.body.data.id).toBe('string');
	});

	it('Post service with labels', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post(
			'/services',
			{
				body: { name: SERVICE_NAME, labels: [{ label: 'name' }] },
			},
			'V2',
		);
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.labels[0].label).toBe('name');
	});

	it('Post service with SP autoAssigned', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post(
			'/services',
			{
				body: { name: SERVICE_NAME, isSpAutoAssigned: true },
			},
			'V2',
		);
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.isSpAutoAssigned).toBe(true);
	});

	it('Post service with video conference default URL', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post(
			'/services',
			{
				body: { name: SERVICE_NAME, videoConferenceUrl: 'http://www.zoom.us/1234567' },
			},
			'V2',
		);
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.videoConferenceUrl).toBe('http://www.zoom.us/1234567');
	});

	it('Post service with invalid video conference default URL', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post(
			'/services',
			{
				body: { name: SERVICE_NAME, videoConferenceUrl: 'www.zoom.us/1234567' },
			},
			'V2',
		);

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
			sendSMSNotifications: false,
		};

		const response = await OrganisationAdminRequestEndpointSG.create({}).post(
			'/services',
			{
				body: { name: SERVICE_NAME },
			},
			'V2',
		);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.additionalSettings).toEqual({
			...additionalSettingsDefaultValues,
			citizenAuthentication: ['singpass'],
		});
	});

	it('should return additionalSettings default values in response when it is set to empty in Post request', async () => {
		const additionalSettingsDefaultValues = {
			allowAnonymousBookings: false,
			isOnHold: false,
			isStandAlone: false,
			sendNotifications: false,
			sendNotificationsToServiceProviders: false,
			sendSMSNotifications: false,
		};

		const response = await OrganisationAdminRequestEndpointSG.create({}).post(
			'/services',
			{
				body: { name: SERVICE_NAME, additionalSettings: undefined },
			},
			'V2',
		);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.additionalSettings).toEqual({
			...additionalSettingsDefaultValues,
			citizenAuthentication: ['singpass'],
		});
	});

	it('should post ALL additionalSettings values and return them in response', async () => {
		const additionalSettingsValues = {
			allowAnonymousBookings: true,
			isOnHold: true,
			isStandAlone: true,
			sendNotifications: true,
			sendNotificationsToServiceProviders: true,
			sendSMSNotifications: true,
		};

		const response = await OrganisationAdminRequestEndpointSG.create({}).post(
			'/services',
			{
				body: { name: SERVICE_NAME, additionalSettings: additionalSettingsValues },
			},
			'V2',
		);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.additionalSettings).toEqual({
			...additionalSettingsValues,
			citizenAuthentication: ['singpass', 'otp'],
		});
	});

	it('(new contract) should post ALL additionalSettings values and return them in response', async () => {
		const additionalSettingsValues = {
			citizenAuthentication: ['otp'],
			isOnHold: true,
			isStandAlone: true,
			sendNotifications: true,
			sendNotificationsToServiceProviders: true,
			sendSMSNotifications: true,
		};

		const response = await OrganisationAdminRequestEndpointSG.create({}).post(
			'/services',
			{
				body: { name: SERVICE_NAME, additionalSettings: additionalSettingsValues },
			},
			'V2',
		);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.additionalSettings).toEqual({
			...additionalSettingsValues,
			allowAnonymousBookings: true,
		});
	});

	it('should post part of the additionalSettings values and return ALL of them in response', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post(
			'/services',
			{
				body: {
					name: SERVICE_NAME,
					additionalSettings: { sendNotifications: true, sendNotificationsToServiceProviders: true },
				},
			},
			'V2',
		);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.additionalSettings).toEqual({
			allowAnonymousBookings: false,
			citizenAuthentication: ['singpass'],
			isOnHold: false,
			isStandAlone: false,
			sendNotifications: true,
			sendNotificationsToServiceProviders: true,
			sendSMSNotifications: false,
		});
	});

	it('Post service with invalid values in additionalSettings', async () => {
		const additionalSettingsValues = {
			allowAnonymousBookings: 'test anonymous',
			isOnHold: 'test onHold',
			isStandAlone: 'test standAlone',
			sendNotifications: 'test notif',
			sendNotificationsToServiceProviders: 'test notifSP',
			sendSMSNotifications: 'test sms notif',
		};

		const response = await OrganisationAdminRequestEndpointSG.create({}).post(
			'/services',
			{
				body: { name: SERVICE_NAME, additionalSettings: additionalSettingsValues },
			},
			'V2',
		);

		const responseData = response.body.data;
		const responseKey = 'request.request.additionalSettings';
		expect(response.statusCode).toEqual(400);
		expect(responseData[`${responseKey}.allowAnonymousBookings`].message).toBe('invalid boolean value');
		expect(responseData[`${responseKey}.isOnHold`].message).toBe('invalid boolean value');
		expect(responseData[`${responseKey}.isStandAlone`].message).toBe('invalid boolean value');
		expect(responseData[`${responseKey}.sendNotifications`].message).toBe('invalid boolean value');
		expect(responseData[`${responseKey}.sendNotificationsToServiceProviders`].message).toBe(
			'invalid boolean value',
		);
		expect(responseData[`${responseKey}.sendSMSNotifications`].message).toBe('invalid boolean value');
		expect(response.body.errorCode).toBe('SYS_INVALID_PARAM');
	});

	it(`Post service with 'days in advance' configuration`, async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({}).post(
			'/services',
			{
				body: { name: SERVICE_NAME, minDaysInAdvance: 10, maxDaysInAdvance: 20 },
			},
			'V2',
		);
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.minDaysInAdvance).toBe(10);
		expect(response.body.data.maxDaysInAdvance).toBe(20);
	});
});
