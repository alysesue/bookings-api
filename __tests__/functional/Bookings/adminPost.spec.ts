import { PgClient } from '../../utils/pgClient';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { populateIndividualTimeslot, populateUserServiceProvider } from '../../Populate/basic';
import { BookingStatus } from '../../../src/models';
import * as request from 'request';

describe('Bookings functional tests as admin', () => {
	const pgClient = new PgClient();
	const startDateTime = new Date(Date.UTC(2051, 11, 10, 0, 0));
	const endDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
	const citizenUinFin = 'S7429377H';
	const citizenName = 'Jane';
	const citizenEmail = 'jane@email.com';
	const NAME_SERVICE_1 = 'service1';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	let serviceProviderId: number;
	let serviceId: number;

	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();
		const result = await populateUserServiceProvider({
			nameService: NAME_SERVICE_1,
			serviceProviderName: SERVICE_PROVIDER_NAME_1,
			agencyUserId: 'A001',
		});
		serviceProviderId = result.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1).id;
		serviceId = result.services.find((item) => item.name === NAME_SERVICE_1).id;
		done();
	});

	const createInSlotBooking = async (): Promise<request.Response> => {
		await populateIndividualTimeslot({
			serviceProviderId,
			weekDay: 0,
			startTime: '08:00',
			endTime: '09:00',
			capacity: 1,
		});

		return await OrganisationAdminRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).post(`/bookings/admin`, {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId,
				citizenUinFin,
				citizenName,
				citizenEmail,
			},
		});
	};

	it('admin should be able to create out of slot booking with accepted status', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).post(`/bookings/admin`, {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId,
				citizenUinFin,
				citizenName,
				citizenEmail,
			},
		});
		expect(response.statusCode).toEqual(201);
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});

	it('admin should create booking in provided slot with accepted status', async () => {
		const response = await createInSlotBooking();
		expect(response.statusCode).toEqual(201);
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});

	it('[SP with no auto accept] admin should be able to create out of slot booking with accepted status', async () => {
		await pgClient.setServiceProviderAutoAccept({
			serviceProviderId,
			autoAcceptBookings: false,
		});
		const response = await OrganisationAdminRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).post(`/bookings/admin`, {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId,
				citizenUinFin,
				citizenName,
				citizenEmail,
			},
		});
		expect(response.statusCode).toEqual(201);
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});

	it('[SP with no auto accept] admin should create booking in provided slot with accepted status', async () => {
		await pgClient.setServiceProviderAutoAccept({
			serviceProviderId,
			autoAcceptBookings: false,
		});

		const response = await createInSlotBooking();
		expect(response.statusCode).toEqual(201);
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});

	it('[SP with no auto accept] admin should update booking', async () => {
		await pgClient.setServiceProviderAutoAccept({
			serviceProviderId,
			autoAcceptBookings: false,
		});
		const createResponse = await createInSlotBooking();
		const bookingId = createResponse.body.data.id;
		expect(bookingId).toBeDefined();
		expect(createResponse.body.data.status).toBe(BookingStatus.Accepted);

		const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/bookings/${bookingId}`, {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId,
				citizenUinFinUpdated: true,
				citizenUinFin,
				citizenName,
				citizenEmail,
			},
		});
		expect(response.statusCode).toEqual(200);
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});
});
