import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { PgClient } from '../../../utils/pgClient';
import { ServiceResponseV1 } from '../../../../src/components/services/service.apicontract';
import { postService, postServiceWithFields } from '../../../populate/V1/services';

describe('Tests endpoint and populate data', () => {
	const SERVICE_NAME = 'Service';
	const SERVICE_NAME_UPDATED = 'ServiceUpdated';
	const pgClient = new PgClient();
	const videoConferenceUrl = 'http://www.zoom.us/1234567';

	beforeAll(async () => {
		await pgClient.cleanAllTables();
	});
	afterAll(async () => {
		await pgClient.close();
	});

	beforeEach(async () => {
		await pgClient.cleanAllTables();
	});

	it("should update first service's name", async () => {
		const service = await postService({ name: SERVICE_NAME });

		const response2 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED },
		});
		expect(response2.statusCode).toEqual(200);

		const response3 = await OrganisationAdminRequestEndpointSG.create({}).get('/services');
		expect(response3.statusCode).toEqual(200);
		expect(response3.body.data[0].name).toEqual(SERVICE_NAME_UPDATED);
	});

	it('Put service with labels', async () => {
		const service = await postService({ name: SERVICE_NAME });
		const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, labels: [{ label: 'name' }] },
		});
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.labels[0].label).toBe('name');
	});

	it('When Put service with same labels should not duplicate', async () => {
		const service = await postService({ name: SERVICE_NAME });
		const update1 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, labels: [{ label: 'name' }] },
		});
		expect(update1.statusCode).toEqual(200);

		const update2 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, labels: [{ label: 'name' }] },
		});

		expect(update2.statusCode).toEqual(200);
		expect(update2.body.data.labels.length).toBe(1);
		expect(update2.body.data.labels[0].id).toBeDefined();
	});

	it('Put service with same labels and same id (should pass)', async () => {
		const service = await postService({ name: SERVICE_NAME });
		const update1 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, labels: [{ label: 'name' }] },
		});

		const update1Service = update1.body.data as ServiceResponseV1;
		expect(update1.statusCode).toEqual(200);
		expect(update1Service.labels.length).toEqual(1);
		expect(update1Service.labels[0].label).toEqual('name');
		const update1LabelId = update1Service.labels[0].id;

		const update2 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, labels: [{ id: update1LabelId, label: 'name2' }] },
		});
		const update2Service = update2.body.data as ServiceResponseV1;

		expect(update2.statusCode).toEqual(200);
		expect(update1Service.labels.length).toEqual(1);
		expect(update2Service.labels[0].id).toEqual(update1LabelId);
		expect(update2Service.labels[0].label).toEqual('name2');
	});

	it('Should delete service labels', async () => {
		const service = await postService({ name: SERVICE_NAME });
		const update1 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: {
				name: SERVICE_NAME,
				labels: [{ label: 'labelA' }, { label: 'labelB' }],
			},
		});
		const update1Service = update1.body.data as ServiceResponseV1;
		expect(update1.statusCode).toEqual(200);
		expect(update1Service.labels.length).toEqual(2);
		expect(update1Service.labels[0].label).toEqual('labelA');

		const update2 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: {
				name: SERVICE_NAME,
				labels: [{ id: update1Service.labels[0].id, label: 'labelA_' }],
			},
		});
		const update2Service = update2.body.data as ServiceResponseV1;

		// Should define an explicit order for labels in the api

		expect(update2.statusCode).toEqual(200);
		expect(update2Service.labels.length).toEqual(1);
		expect(update2Service.labels[0].id).toEqual(update1Service.labels[0].id);
		expect(update2Service.labels[0].label).toEqual('labelA_');
	});

	it("should update service's SP autoAssigned flag", async () => {
		const service = await postService({ name: SERVICE_NAME });

		const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED, isSpAutoAssigned: true },
		});
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.isSpAutoAssigned).toBe(true);

		const response2 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED, isSpAutoAssigned: false },
		});
		expect(response2.statusCode).toEqual(200);
		expect(response2.body.data.isSpAutoAssigned).toBe(false);
	});

	it("should update service's video conference URL", async () => {
		const service = await postServiceWithFields({ name: SERVICE_NAME, videoConferenceUrl });

		const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, videoConferenceUrl: 'http://www.zoom.us/7654321' },
		});
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.videoConferenceUrl).toBe('http://www.zoom.us/7654321');
	});

	it("should not update service's video conference URL", async () => {
		const service = await postServiceWithFields({ name: SERVICE_NAME, videoConferenceUrl });

		const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME, videoConferenceUrl: 'www.zoom.us/7654321' },
		});

		expect(response.body.errorCode).toBe('SYS_INVALID_PARAM');
		expect(response.body.errorMessage).toBe('One or more business validations failed');
	});

	it('should return additionalSettings default values in response when it is not set in Put request', async () => {
		const additionalSettingsDefaultValues = {
			allowAnonymousBookings: false,
			isOnHold: false,
			isStandAlone: false,
			sendNotifications: false,
			sendNotificationsToServiceProviders: false,
			sendSMSNotifications: false,
			hasSalutations: false,
		};

		const service = await postService({ name: SERVICE_NAME });

		const putResponse = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED },
		});

		expect(putResponse.statusCode).toEqual(200);
		expect(putResponse.body.data.additionalSettings).toEqual({
			...additionalSettingsDefaultValues,
			bookingLimitation: {
				bookingLimitationType: 'NoLimitations',
			},
			citizenAuthentication: ['singpass'],
		});
	});

	it('should return additionalSettings default values in response when it is set to empty in Put request', async () => {
		const additionalSettingsDefaultValues = {
			allowAnonymousBookings: false,
			isOnHold: false,
			isStandAlone: false,
			sendNotifications: false,
			sendNotificationsToServiceProviders: false,
			sendSMSNotifications: false,
			hasSalutations: false,
		};

		const service = await postService({ name: SERVICE_NAME });

		const putResponse = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED, additionalSettings: undefined },
		});

		expect(putResponse.statusCode).toEqual(200);
		expect(putResponse.body.data.additionalSettings).toEqual({
			...additionalSettingsDefaultValues,
			bookingLimitation: {
				bookingLimitationType: 'NoLimitations',
			},
			citizenAuthentication: ['singpass'],
		});
	});

	it('should update ALL additionalSettings values and return them in response', async () => {
		const additionalSettingsUpdated = {
			allowAnonymousBookings: true,
			isOnHold: true,
			isStandAlone: true,
			sendNotifications: true,
			sendNotificationsToServiceProviders: true,
			sendSMSNotifications: false,
			hasSalutations: true,
		};

		const service = await postService({ name: SERVICE_NAME });

		const putResponse = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED, additionalSettings: additionalSettingsUpdated },
		});

		expect(putResponse.statusCode).toEqual(200);
		expect(putResponse.body.data.additionalSettings).toEqual({
			...additionalSettingsUpdated,
			bookingLimitation: {
				bookingLimitationType: 'NoLimitations',
			},
			citizenAuthentication: ['singpass', 'otp'],
		});
	});

	it('(new contract) should update ALL additionalSettings values and return them in response', async () => {
		const additionalSettingsUpdated = {
			citizenAuthentication: ['otp'],
			isOnHold: true,
			isStandAlone: true,
			sendNotifications: true,
			sendNotificationsToServiceProviders: true,
			sendSMSNotifications: true,
			hasSalutations: true,
		};

		const service = await postService({ name: SERVICE_NAME });

		const putResponse = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED, additionalSettings: additionalSettingsUpdated },
		});

		expect(putResponse.statusCode).toEqual(200);
		expect(putResponse.body.data.additionalSettings).toEqual({
			...additionalSettingsUpdated,
			bookingLimitation: {
				bookingLimitationType: 'NoLimitations',
			},
			allowAnonymousBookings: true,
		});
	});

	it('should update part of the additionalSettings values and return ALL of them in response', async () => {
		const expectedAdditionalSettings = {
			allowAnonymousBookings: true,
			isOnHold: true,
			isStandAlone: false,
			sendNotifications: false,
			sendNotificationsToServiceProviders: false,
			sendSMSNotifications: false,
			hasSalutations: false,
		};

		const service = await postService({ name: SERVICE_NAME });

		const putResponse = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED, additionalSettings: { allowAnonymousBookings: true, isOnHold: true } },
		});

		expect(putResponse.statusCode).toEqual(200);
		expect(putResponse.body.data.additionalSettings).toEqual({
			...expectedAdditionalSettings,
			bookingLimitation: {
				bookingLimitationType: 'NoLimitations',
			},
			citizenAuthentication: ['singpass', 'otp'],
		});
	});

	it('should update additionalSettings values from true to false', async () => {
		const additionalSettingsTrue = {
			allowAnonymousBookings: true,
			isOnHold: true,
			isStandAlone: true,
			sendNotifications: true,
			sendNotificationsToServiceProviders: true,
			sendSMSNotifications: true,
			hasSalutations: true,
		};

		const additionalSettingsFalse = {
			allowAnonymousBookings: false,
			isOnHold: false,
			isStandAlone: false,
			sendNotifications: false,
			sendNotificationsToServiceProviders: false,
			sendSMSNotifications: false,
			hasSalutations: false,
		};

		const service = await postService({ name: SERVICE_NAME });
		const putResponse = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED, additionalSettings: additionalSettingsTrue },
		});

		expect(putResponse.statusCode).toEqual(200);
		expect(putResponse.body.data.additionalSettings).toEqual({
			...additionalSettingsTrue,
			bookingLimitation: {
				bookingLimitationType: 'NoLimitations',
			},
			citizenAuthentication: ['singpass', 'otp'],
		});

		const putResponse2 = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED, additionalSettings: additionalSettingsFalse },
		});

		expect(putResponse2.statusCode).toEqual(200);
		expect(putResponse2.body.data.additionalSettings).toEqual({
			allowAnonymousBookings: false,
			bookingLimitation: {
				bookingLimitationType: 'NoLimitations',
			},
			citizenAuthentication: ['singpass'],
			isOnHold: false,
			isStandAlone: false,
			sendNotifications: false,
			sendNotificationsToServiceProviders: false,
			sendSMSNotifications: false,
			hasSalutations: false,
		});
	});

	it('Put service with invalid values in additionalSettings', async () => {
		const additionalSettingsValues = {
			allowAnonymousBookings: 'test anonymous',
			isOnHold: 'test onHold',
			isStandAlone: 'test standAlone',
			sendNotifications: 'test notif',
			sendNotificationsToServiceProviders: 'test notifSP',
			sendSMSNotifications: 'test sms notif',
			hasSalutations: 'test has salutations',
		};

		const service = await postService({ name: SERVICE_NAME });

		const putResponse = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED, additionalSettings: additionalSettingsValues },
		});

		const responseData = putResponse.body.data;
		const responseKey = 'serviceRequest.serviceRequest.additionalSettings';
		expect(putResponse.statusCode).toEqual(400);
		expect(responseData[`${responseKey}.allowAnonymousBookings`].message).toBe('invalid boolean value');
		expect(responseData[`${responseKey}.isOnHold`].message).toBe('invalid boolean value');
		expect(responseData[`${responseKey}.isStandAlone`].message).toBe('invalid boolean value');
		expect(responseData[`${responseKey}.sendNotifications`].message).toBe('invalid boolean value');
		expect(responseData[`${responseKey}.sendNotificationsToServiceProviders`].message).toBe(
			'invalid boolean value',
		);
		expect(responseData[`${responseKey}.hasSalutations`].message).toBe('invalid boolean value');
		expect(responseData[`${responseKey}.sendSMSNotifications`].message).toBe('invalid boolean value');
		expect(putResponse.body.errorCode).toBe('SYS_INVALID_PARAM');
	});

	it(`Put service with 'days in advance' configuration`, async () => {
		const service = await postService({ name: SERVICE_NAME });

		const putResponse = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${service.id}`, {
			body: { name: SERVICE_NAME_UPDATED, minDaysInAdvance: 10, maxDaysInAdvance: 20 },
		});

		expect(putResponse.statusCode).toEqual(200);
		expect(putResponse.body.data.minDaysInAdvance).toBe(10);
		expect(putResponse.body.data.maxDaysInAdvance).toBe(20);
	});
});
