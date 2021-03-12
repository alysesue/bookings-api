import { PgClient } from '../../utils/pgClient';
import {
	AnonmymousEndpointSG,
	CitizenRequestEndpointSG, OrganisationAdminRequestEndpointSG,
} from '../../utils/requestEndpointSG';
import { populateOutOfSlotBooking, populateUserServiceProvider, populateWeeklyTimesheet } from '../../Populate/basic';
import { ServiceProviderResponseModel } from '../../../src/components/serviceProviders/serviceProviders.apicontract';
import * as request from 'request';
import { BookingStatus } from '../../../src/models';

// tslint:disable-next-line: no-big-function
describe('Bookings functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	const START_TIME_1 = '09:00';
	const END_TIME_1 = '12:00';

	const citizenUinFin = 'S7429377H';
	const citizenName = 'Jane';
	const citizenEmail = 'jane@email.com';

	let serviceProvider: ServiceProviderResponseModel;
	let serviceId;

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();

		const result = await populateUserServiceProvider({
			nameService: NAME_SERVICE_1,
			serviceProviderName: SERVICE_PROVIDER_NAME_1,
			agencyUserId: 'A001',
		});
		serviceProvider = result.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1);

		serviceId = result.services.find((item) => item.name === NAME_SERVICE_1).id;

		await populateWeeklyTimesheet({
			serviceProviderId: serviceProvider.id,
			openTime: START_TIME_1,
			closeTime: END_TIME_1,
			scheduleSlot: 60,
		});

		done();
	});

	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	const postCitizenInSlotServiceBooking = async (): Promise<request.Response> => {
		const startDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 2, 0));

		const endpoint = CitizenRequestEndpointSG.create({
			citizenUinFin,
			serviceId,
		});
		return await endpoint.post('/bookings', {
			body: {
				startDateTime,
				endDateTime,
				citizenName,
				citizenEmail,
			},
		});
	};

	const postCitizenInSlotServiceProviderBooking = async (): Promise<request.Response> => {
		const startDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 2, 0));

		const endpoint = CitizenRequestEndpointSG.create({
			citizenUinFin,
			serviceId,
		});
		return await endpoint.post('/bookings', {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId: serviceProvider.id,
				citizenName,
				citizenEmail,
			},
		});
	};

	const postCitizenReschedule = async (bookingId: number): Promise<request.Response> => {
		const startDateTime = new Date(Date.UTC(2051, 11, 10, 3, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 4, 0));

		const endpoint = CitizenRequestEndpointSG.create({
			citizenUinFin,
			serviceId,
		});

		return await endpoint.post(`/bookings/${bookingId}/reschedule`, {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId: serviceProvider.id,
				citizenName,
				citizenEmail,
			},
		});
	};

	const postCitizenServiceOnHoldBooking = async (): Promise<request.Response> => {
		await pgClient.setServiceConfigurationOnHold(serviceId, true);

		const startDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 2, 0));

		const endpoint = CitizenRequestEndpointSG.create({
			citizenUinFin,
			serviceId,
		});
		return await endpoint.post('/bookings', {
			body: {
				startDateTime,
				endDateTime,
			},
		});
	};

	const postCitizenServiceProviderOnHoldBooking = async (): Promise<request.Response> => {
		await pgClient.setServiceConfigurationOnHold(serviceId, true);

		const startDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 2, 0));

		const endpoint = CitizenRequestEndpointSG.create({
			citizenUinFin,
			serviceId,
		});
		return await endpoint.post('/bookings', {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId: serviceProvider.id,
			},
		});
	};

	it('[On hold] Citizen should make an on hold SERVICE booking when on hold flag is true', async () => {
		const response = await postCitizenServiceOnHoldBooking();
		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(response.body.data.status).toBe(BookingStatus.OnHold);
	});

	it('[On hold] Citizen should make an on hold SERVICE PROVIDER booking when on hold flag is true', async () => {
		const response = await postCitizenServiceProviderOnHoldBooking();
		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(response.body.data.status).toBe(BookingStatus.OnHold);
	});

	it('[On hold] Citizen should NOT make an on hold SERVICE booking when on hold flag is false', async () => {
		const response = await postCitizenInSlotServiceBooking();
		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(response.body.data.status).not.toBe(BookingStatus.OnHold);
	});

	it('[On hold] Citizen should NOT make an on hold SERVICE PROVIDER booking when on hold flag is false', async () => {
		const response = await postCitizenInSlotServiceProviderBooking();
		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(response.body.data.status).not.toBe(BookingStatus.OnHold);
	});

	it('[On hold] Admin should validate SERVICE on hold booking', async () => {
		const response = await postCitizenServiceOnHoldBooking();
		const bookingId = response.body.data.id;

		const adminValidateOnHoldResponse = await OrganisationAdminRequestEndpointSG.create({}).post(
			`/bookings/${bookingId}/validateOnHold`,
			{
				body: {
					citizenName,
					citizenEmail,
					citizenUinFin,
				},
			},
		);

		expect(adminValidateOnHoldResponse.statusCode).toEqual(200);
		expect(adminValidateOnHoldResponse.body.data.status).toEqual(BookingStatus.PendingApproval);
	});

	it('[On hold] Admin should validate SERVICE PROVIDER on hold booking', async () => {
		const response = await postCitizenServiceProviderOnHoldBooking();
		const bookingId = response.body.data.id;

		const adminValidateOnHoldResponse = await OrganisationAdminRequestEndpointSG.create({}).post(
			`/bookings/${bookingId}/validateOnHold`,
			{
				body: {
					citizenName,
					citizenEmail,
					citizenUinFin,
				},
			},
		);

		expect(adminValidateOnHoldResponse.statusCode).toEqual(200);
		expect(adminValidateOnHoldResponse.body.data.status).toEqual(BookingStatus.Accepted);
	});

	it('admin should create out of slot booking and citizen cancels a booking', async () => {
		const startDateTime = new Date(Date.UTC(2051, 11, 10, 0, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));

		const bookingId = await populateOutOfSlotBooking({
			startDateTime,
			endDateTime,
			serviceId,
			serviceProviderId: serviceProvider.id,
			citizenUinFin,
			citizenName,
			citizenEmail,
		});
		const citizenCancelBookingResponse = await CitizenRequestEndpointSG.create({}).post(
			`/bookings/${bookingId}/cancel`,
			{},
		);
		expect(citizenCancelBookingResponse.statusCode).toEqual(204);
	});

	it('should NOT create out-of-slot booking as a citizen', async () => {
		const startDateTime = new Date(Date.UTC(2051, 11, 10, 0, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));

		const endpoint = CitizenRequestEndpointSG.create({
			citizenUinFin,
			serviceId,
		});
		try {
			await endpoint.post('/bookings', {
				body: {
					startDateTime,
					endDateTime,
					serviceProviderId: serviceProvider.id,
					citizenName,
					citizenEmail,
				},
			});
			fail('should throw');
		} catch (e) {
			expect(e.httpStatusCode).toBe(400);
		}
	});

	it('[Auto Accept] should create in-slot booking as a citizen', async () => {
		const response = await postCitizenInSlotServiceProviderBooking();
		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(response.body.data.id).toBeDefined();
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});

	it('[Auto Accept] should reschedule in-slot booking as a citizen', async () => {
		const bookingResponse = await postCitizenInSlotServiceProviderBooking();
		const bookingId = bookingResponse.body.data.id;
		const response = await postCitizenReschedule(bookingId);

		expect(response.statusCode).toBe(200);
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});

	it('[Pending approval] should create in-slot booking as a citizen', async () => {
		await pgClient.setServiceProviderAutoAccept({
			serviceProviderId: serviceProvider.id,
			autoAcceptBookings: false,
		});
		const response = await postCitizenInSlotServiceProviderBooking();
		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(response.body.data.id).toBeDefined();
		expect(response.body.data.status).toBe(BookingStatus.PendingApproval);
	});

	it('[Pending approval] should reschedule in-slot booking as a citizen', async () => {
		await pgClient.setServiceProviderAutoAccept({
			serviceProviderId: serviceProvider.id,
			autoAcceptBookings: false,
		});
		const bookingResponse = await postCitizenInSlotServiceProviderBooking();
		const bookingId = bookingResponse.body.data.id;
		const response = await postCitizenReschedule(bookingId);

		expect(response.statusCode).toBe(200);
		expect(response.body.data.status).toBe(BookingStatus.PendingApproval);
	});

	it('[Pending approval - change after booking] should reschedule in-slot booking as a citizen', async () => {
		const bookingResponse = await postCitizenInSlotServiceProviderBooking();
		const bookingId = bookingResponse.body.data.id;

		await pgClient.setServiceProviderAutoAccept({
			serviceProviderId: serviceProvider.id,
			autoAcceptBookings: false,
		});
		const response = await postCitizenReschedule(bookingId);

		expect(response.statusCode).toBe(200);
		expect(response.body.data.status).toBe(BookingStatus.PendingApproval);
	});

	it('should NOT create in-slot booking as anonymous (when service is not configured)', async () => {
		const startDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 2, 0));

		const endpoint = await AnonmymousEndpointSG.create({
			serviceId,
		});

		try {
			await endpoint.post('/bookings', {
				body: {
					startDateTime,
					endDateTime,
					serviceProviderId: serviceProvider.id,
					citizenUinFin,
					citizenName,
					citizenEmail,
				},
			});

			fail('should throw');
		} catch (e) {
			expect(e.httpStatusCode).toBe(404);
		}
	});

	it('should create in-slot booking as anonymous (when service is configured)', async () => {
		await pgClient.configureServiceAllowAnonymous({ serviceId });

		const startDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 2, 0));

		const endpoint = await AnonmymousEndpointSG.create({
			serviceId,
		});
		const response = await endpoint.post('/bookings', {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId: serviceProvider.id,
				citizenUinFin,
				citizenName,
				citizenEmail,
			},
		});

		expect(response.statusCode).toBe(201);
	});
});
