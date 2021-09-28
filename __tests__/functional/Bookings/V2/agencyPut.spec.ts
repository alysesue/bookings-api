import { PgClient } from '../../../utils/pgClient';
import { AgencyRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { populateIndividualTimeslot, populateUserServiceProvider } from '../../../populate/basicV2';
import { BookingStatus } from '../../../../src/models';
import * as request from 'request';
import { BookingValidationType } from '../../../../src/models/bookingValidationType';

describe('Bookings functional tests as agency for PUT request', () => {
	const pgClient = new PgClient();
	const startDateTime = new Date(Date.UTC(2051, 11, 10, 0, 0));
	const endDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
	const citizenUinFin = 'S7429377H';
	const citizenName = 'Jane';
	const citizenEmail = 'jane@email.com';
	const NAME_SERVICE_1 = 'service1';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	let serviceProviderId: string;
	let serviceId: string;
	const validationType = BookingValidationType.Admin;

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

		return await AgencyRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).post(
			`/bookings`,
			{
				body: {
					startDateTime,
					endDateTime,
					serviceProviderId,
					citizenUinFin,
					citizenName,
					citizenEmail,
					validationType,
				},
			},
			'V2',
		);
	};

	it('agency as admin should be able to update a booking to a provided slot with accepted status', async () => {
		await createInSlotBooking();
		const getResponse = await AgencyRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).get(`/bookings`, {}, 'V2');
		expect(getResponse.body.data.length).toEqual(1);

		await populateIndividualTimeslot({
			serviceProviderId,
			weekDay: 0,
			startTime: '09:00',
			endTime: '10:00',
			capacity: 1,
		});
		const bookingId = getResponse.body.data[0].id;
		const putResponse = await AgencyRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).put(
			`/bookings/${bookingId}`,
			{
				body: {
					startDateTime: new Date(Date.UTC(2051, 11, 10, 1, 0)),
					endDateTime: new Date(Date.UTC(2051, 11, 10, 2, 0)),
					serviceProviderId,
					citizenUinFin,
					citizenName,
					citizenEmail,
					validationType,
				},
			},
			'V2',
		);

		expect(typeof bookingId).toBe('string');
		expect(putResponse.statusCode).toEqual(200);
		expect(putResponse.body.data.status).toBe(BookingStatus.Accepted);
		const getResponse2 = await AgencyRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).get(`/bookings`, {}, 'V2');
		expect(getResponse2.body.data.length).toEqual(1);
		expect(typeof getResponse2.body.data[0].serviceId).toBe('string');
		expect(typeof getResponse2.body.data[0].serviceProviderId).toBe('string');
		expect(getResponse2.body.data.length).toEqual(1);
		expect(getResponse2.body.data[0].startDateTime).toEqual('2051-12-10T01:00:00.000Z');
		expect(getResponse2.body.data[0].endDateTime).toEqual('2051-12-10T02:00:00.000Z');
	});

	it('agency as admin should be able to update a booking to out of slot timeslot with accepted status', async () => {
		await createInSlotBooking();
		const getResponse = await AgencyRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).get(`/bookings`, {}, 'V2');
		expect(getResponse.body.data.length).toEqual(1);

		const bookingId = getResponse.body.data[0].id;
		const putResponse = await AgencyRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).put(
			`/bookings/${bookingId}`,
			{
				body: {
					startDateTime: new Date(Date.UTC(2051, 11, 10, 1, 0)),
					endDateTime: new Date(Date.UTC(2051, 11, 10, 2, 0)),
					serviceProviderId,
					citizenUinFin,
					citizenName,
					citizenEmail,
					validationType,
				},
			},
			'V2',
		);

		expect(typeof bookingId).toBe('string');
		expect(putResponse.statusCode).toEqual(200);
		expect(putResponse.body.data.status).toBe(BookingStatus.Accepted);
		const getResponse2 = await AgencyRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).get(`/bookings`, {}, 'V2');
		expect(getResponse2.body.data.length).toEqual(1);
		expect(typeof getResponse2.body.data[0].serviceId).toBe('string');
		expect(typeof getResponse2.body.data[0].serviceProviderId).toBe('string');
		expect(getResponse2.body.data[0].startDateTime).toEqual('2051-12-10T01:00:00.000Z');
		expect(getResponse2.body.data[0].endDateTime).toEqual('2051-12-10T02:00:00.000Z');
	});

	it('agency as citizen should be able to update a booking to a provided slot with accepted status', async () => {
		await createInSlotBooking();
		const getResponse = await AgencyRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).get(`/bookings`, {}, 'V2');
		expect(getResponse.body.data.length).toEqual(1);

		await populateIndividualTimeslot({
			serviceProviderId,
			weekDay: 0,
			startTime: '09:00',
			endTime: '10:00',
			capacity: 1,
		});
		const bookingId = getResponse.body.data[0].id;
		const putResponse = await AgencyRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).put(
			`/bookings/${bookingId}`,
			{
				body: {
					startDateTime: new Date(Date.UTC(2051, 11, 10, 1, 0)),
					endDateTime: new Date(Date.UTC(2051, 11, 10, 2, 0)),
					serviceProviderId,
					citizenUinFin,
					citizenName,
					citizenEmail,
					validationType: BookingValidationType.Citizen,
				},
			},
			'V2',
		);

		expect(typeof bookingId).toBe('string');
		expect(putResponse.statusCode).toEqual(200);
		expect(putResponse.body.data.status).toBe(BookingStatus.Accepted);
		const getResponse2 = await AgencyRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).get(`/bookings`, {}, 'V2');
		expect(getResponse2.body.data.length).toEqual(1);
		expect(typeof getResponse2.body.data[0].serviceId).toBe('string');
		expect(typeof getResponse2.body.data[0].serviceProviderId).toBe('string');
		expect(getResponse2.body.data[0].startDateTime).toEqual('2051-12-10T01:00:00.000Z');
		expect(getResponse2.body.data[0].endDateTime).toEqual('2051-12-10T02:00:00.000Z');
	});

	it('agency as citizen should NOT be able to update a booking to out of slot timeslot', async () => {
		await createInSlotBooking();
		const getResponse = await AgencyRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).get(`/bookings`, {}, 'V2');
		expect(getResponse.body.data.length).toEqual(1);

		const bookingId = getResponse.body.data[0].id;
		const putResponse = await AgencyRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).put(
			`/bookings/${bookingId}`,
			{
				body: {
					startDateTime: new Date(Date.UTC(2051, 11, 10, 1, 0)),
					endDateTime: new Date(Date.UTC(2051, 11, 10, 2, 0)),
					serviceProviderId,
					citizenUinFin,
					citizenName,
					citizenEmail,
					validationType: BookingValidationType.Citizen,
				},
			},
			'V2',
		);

		expect(typeof bookingId).toBe('string');
		expect(putResponse.statusCode).toEqual(400);
		const getResponse2 = await AgencyRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).get(`/bookings`, {}, 'V2');
		expect(getResponse2.body.data.length).toEqual(1);
		expect(typeof getResponse2.body.data[0].serviceId).toBe('string');
		expect(typeof getResponse2.body.data[0].serviceProviderId).toBe('string');
		expect(getResponse2.body.data[0].startDateTime).toEqual('2051-12-10T00:00:00.000Z');
		expect(getResponse2.body.data[0].endDateTime).toEqual('2051-12-10T01:00:00.000Z');
	});
});