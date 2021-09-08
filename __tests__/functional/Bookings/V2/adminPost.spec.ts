import { PgClient } from '../../../utils/pgClient';
import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { populateIndividualTimeslot, populateUserServiceProvider } from '../../../populate/basicV2';
import { BookingStatus } from '../../../../src/models';
import * as request from 'request';
import { IdHasherForFunctional } from '../../../utils/idHashingUtil';

describe('Bookings functional tests as admin', () => {
	const pgClient = new PgClient();
	const idHasher = new IdHasherForFunctional();
	const startDateTime = new Date(Date.UTC(2051, 11, 10, 0, 0));
	const endDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
	const citizenUinFin = 'S7429377H';
	const citizenName = 'Jane';
	const citizenEmail = 'jane@email.com';
	const phoneNumber = '123456789';
	const location = 'Singapore';
	const videoConferenceLink = 'www.google.com';
	const description =
		// eslint-disable-next-line max-len
		'Lorem ipsum dolor sit amet, !@#$%^&*()-+? adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
	const NAME_SERVICE_1 = 'service1';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	let serviceProviderId: string;
	let serviceId: string;
	let unsignedServiceProviderId: number;

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

		unsignedServiceProviderId = await idHasher.convertHashToId(serviceProviderId);

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
		}).post(
			`/bookings/admin`,
			{
				body: {
					startDateTime,
					endDateTime,
					serviceProviderId,
					citizenUinFin,
					citizenName,
					citizenEmail,
				},
			},
			'V2',
		);
	};

	it('admin should be able to create out of slot booking with accepted status', async () => {
		const response = await OrganisationAdminRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).post(
			`/bookings/admin`,
			{
				body: {
					startDateTime,
					endDateTime,
					serviceProviderId,
					citizenUinFin,
					citizenName,
					citizenEmail,
					phoneNumber,
					location,
					videoConferenceLink,
					description,
				},
			},
			'V2',
		);
		expect(response.statusCode).toEqual(201);
		expect(typeof response.body.data.id).toBe('string');
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});

	it('admin should create booking in provided slot with accepted status', async () => {
		const response = await createInSlotBooking();
		expect(response.statusCode).toEqual(201);
		expect(typeof response.body.data.id).toBe('string');
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});

	it('[SP with no auto accept] admin should be able to create out of slot booking with accepted status', async () => {
		await pgClient.setServiceProviderAutoAccept({
			serviceProviderId: unsignedServiceProviderId,
			autoAcceptBookings: false,
		});
		const response = await OrganisationAdminRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).post(
			`/bookings/admin`,
			{
				body: {
					startDateTime,
					endDateTime,
					serviceProviderId,
					citizenUinFin,
					citizenName,
					citizenEmail,
				},
			},
			'V2',
		);
		expect(response.statusCode).toEqual(201);
		expect(typeof response.body.data.id).toBe('string');
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});

	it('[SP with no auto accept] admin should create booking in provided slot with accepted status', async () => {
		await pgClient.setServiceProviderAutoAccept({
			serviceProviderId: unsignedServiceProviderId,
			autoAcceptBookings: false,
		});

		const response = await createInSlotBooking();
		expect(response.statusCode).toEqual(201);
		expect(typeof response.body.data.id).toBe('string');
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});

	it('[SP with no auto accept] admin should update booking', async () => {
		await pgClient.setServiceProviderAutoAccept({
			serviceProviderId: unsignedServiceProviderId,
			autoAcceptBookings: false,
		});
		const createResponse = await createInSlotBooking();
		const bookingId = createResponse.body.data.id;
		expect(bookingId).toBeDefined();
		expect(typeof bookingId).toBe('string');
		expect(createResponse.body.data.status).toBe(BookingStatus.Accepted);

		const response = await OrganisationAdminRequestEndpointSG.create({}).put(
			`/bookings/${bookingId}`,
			{
				body: {
					startDateTime,
					endDateTime,
					serviceProviderId,
					citizenUinFinUpdated: true,
					citizenUinFin,
					citizenName,
					citizenEmail,
					phoneNumber,
					location,
					videoConferenceLink,
					description,
				},
			},
			'V2',
		);
		expect(response.statusCode).toEqual(200);
		expect(typeof response.body.data.id).toBe('string');
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});
});
