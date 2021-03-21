import { PgClient } from '../../utils/pgClient';
import {
	AgencyRequestEndpointSG,
	AnonmymousEndpointSG,
	CitizenRequestEndpointSG, ServiceAdminRequestEndpointSG,
} from '../../utils/requestEndpointSG';
import {populateOutOfSlotBooking, populateUserServiceProvider, populateWeeklyTimesheet} from '../../Populate/basic';
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

	const postAdminBookingWithStartEndTimeOnly = async (isOnHold: boolean, isStandAlone: boolean, serviceProviderId?: number): Promise<request.Response> => {
		await pgClient.setServiceConfigurationOnHold(serviceId, isOnHold);
		await pgClient.setServiceConfigurationStandAlone(serviceId, isStandAlone);

		const startDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
		const endDateTime = new Date(Date.UTC(2051, 11, 10, 2, 0));

		const endpoint = ServiceAdminRequestEndpointSG.create({
			nameService: NAME_SERVICE_1,
			serviceId,
		});
		return await endpoint.post('/bookings', {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId: serviceProviderId || undefined,
			},
		});
	};

	const postCitizenBookingWithStartEndDateOnly = async (isOnHold: boolean, isStandAlone: boolean, serviceProviderId?: number): Promise<request.Response> => {
		await pgClient.setServiceConfigurationOnHold(serviceId, isOnHold);
		await pgClient.setServiceConfigurationStandAlone(serviceId, isStandAlone);

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
				serviceProviderId: serviceProviderId || undefined,
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

	it('[On hold] Citizen should make an on hold SERVICE booking when on hold flag is true', async () => {
		try {
			await postCitizenBookingWithStartEndDateOnly(true, false);
		} catch(e) {
			const error = e.toString();
			expect(error).toBe(`SYS_NETWORK_ERROR (400): An unexpected error has occurred.`);
		}
	});

	it('[On hold] Citizen should make an on hold SERVICE PROVIDER booking when on hold flag is true', async () => {
		try {
			await postCitizenBookingWithStartEndDateOnly(true, false, serviceProvider.id);
		} catch(e) {
			const error = e.toString();
			expect(error).toBe(`SYS_NETWORK_ERROR (400): An unexpected error has occurred.`);
		}
	});

	it('[On hold] Citizen should NOT make an on hold SERVICE booking when on hold flag is false', async () => {
		try {
			await postCitizenBookingWithStartEndDateOnly(false, false);
		} catch(e) {
			const error = e.toString();
			expect(error).toBe(`SYS_NETWORK_ERROR (400): An unexpected error has occurred.`);
		}
	});

	it('[On hold] Citizen should NOT make an on hold SERVICE PROVIDER booking when on hold flag is false', async () => {
		try {
			await postCitizenBookingWithStartEndDateOnly(false, false, serviceProvider.id);
		} catch(e) {
			const error = e.toString();
			expect(error).toBe(`SYS_NETWORK_ERROR (400): An unexpected error has occurred.`);
		}
	});

	it('[On hold] Agency should validate SERVICE on hold booking', async () => {
		const response = await postCitizenBookingWithStartEndDateOnly(true, false);
		const bookingId = response.body.data.id;

		const adminValidateOnHoldResponse = await AgencyRequestEndpointSG.create({}).post(
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

	it('[On hold] Agency should validate SERVICE PROVIDER on hold booking', async () => {
		const response = await postCitizenBookingWithStartEndDateOnly(true, false, serviceProvider.id);
		const bookingId = response.body.data.id;

		const adminValidateOnHoldResponse = await AgencyRequestEndpointSG.create({}).post(
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

	it('[On hold] Admin should NOT make a SERVICE on hold booking when on hold flag is true', async () => {
		try {
			await postAdminBookingWithStartEndTimeOnly(true, false);
		} catch(e) {
			const error = e.toString();
			expect(error).toBe(`SYS_NETWORK_ERROR (400): An unexpected error has occurred.`);
		}
	});

	it('[On hold] Admin should NOT make a SERVICE PROVIDER on hold booking when on hold flag is true', async () => {
		try {
			await postAdminBookingWithStartEndTimeOnly(true, false, serviceProvider.id);
		} catch(e) {
			const error = e.toString();
			expect(error).toBe(`SYS_NETWORK_ERROR (400): An unexpected error has occurred.`);
		}
	});

	it('[On hold] Admin should NOT make a SERVICE on hold booking when on hold flag is false', async () => {
		try {
			await postAdminBookingWithStartEndTimeOnly(false, false);
		} catch(e) {
			const error = e.toString();
			expect(error).toBe(`SYS_NETWORK_ERROR (400): An unexpected error has occurred.`);
		}
	});

	it('[On hold] Admin should NOT make a SERVICE PROVIDER on hold booking when on hold flag is false', async () => {
		try {
			await postAdminBookingWithStartEndTimeOnly(false, false, serviceProvider.id);
		} catch(e) {
			const error = e.toString();
			expect(error).toBe(`SYS_NETWORK_ERROR (400): An unexpected error has occurred.`);
		}
	});

	it('[Stand alone] Citizen should make a stand alone SERVICE booking when stand alone flag is true', async () => {
		const response = await postCitizenBookingWithStartEndDateOnly(false, true);
		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(response.body.data.status).toBe(BookingStatus.OnHold);
	});

	it('[Stand alone] Citizen should make a stand alone SERVICE PROVIDER booking when stand alone flag is true', async () => {
		const response = await postCitizenBookingWithStartEndDateOnly(false, true, serviceProvider.id);
		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(response.body.data.status).toBe(BookingStatus.OnHold);
	});

	it('[Stand alone] Citizen should NOT make a stand alone SERVICE booking when stand alone flag is false', async () => {
		try {
			await postCitizenBookingWithStartEndDateOnly(false, false);
		} catch (e) {
			const error = e.toString();
			expect(error).toBe(`SYS_NETWORK_ERROR (400): An unexpected error has occurred.`);
		}
	});

	it('[Stand alone] Citizen should NOT make a stand alone SERVICE PROVIDER booking when stand alone flag is false', async () => {
		try {
			await postCitizenBookingWithStartEndDateOnly(false, false, serviceProvider.id);
		} catch (e) {
			const error = e.toString();
			expect(error).toBe(`SYS_NETWORK_ERROR (400): An unexpected error has occurred.`);
		}
	});

	it('[Stand alone] Admin should NOT make a SERVICE stand alone booking when stand alone flag is true', async () => {
		try {
			await postAdminBookingWithStartEndTimeOnly(false, true)
		} catch (e) {
			const error = e.toString();
			expect(error).toBe(`SYS_NETWORK_ERROR (400): An unexpected error has occurred.`);
		}
	});

	it('[Stand alone] Admin should NOT make a SERVICE PROVIDER stand alone booking when stand alone flag is true', async () => {
		try {
			await postAdminBookingWithStartEndTimeOnly(false, true, serviceProvider.id);
		} catch (e) {
			const error = e.toString();
			expect(error).toBe(`SYS_NETWORK_ERROR (400): An unexpected error has occurred.`);
		}
	});

	it('[Stand alone] Admin should NOT make a SERVICE stand alone booking when stand alone flag is false', async () => {
		try {
			await postAdminBookingWithStartEndTimeOnly(false, false);
		} catch (e) {
			const error = e.toString();
			expect(error).toBe(`SYS_NETWORK_ERROR (400): An unexpected error has occurred.`);
		}
	});

	it('[Stand alone] Admin should NOT make a SERVICE PROVIDER stand alone booking when stand alone flag is false', async () => {
		try {
			await postAdminBookingWithStartEndTimeOnly(false, false, serviceProvider.id);
		} catch (e) {
			const error = e.toString();
			expect(error).toBe(`SYS_NETWORK_ERROR (400): An unexpected error has occurred.`);
		}
	});

	it('[On hold & Stand alone] Citizen should make an on hold SERVICE booking when on hold and stand alone flag is true', async () => {
		const response  = await postCitizenBookingWithStartEndDateOnly(true, true);
		expect(response.statusCode).toBe(201);
		expect(response.body).toBeDefined();
		expect(response.body.data.status).toBe(BookingStatus.OnHold);
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
