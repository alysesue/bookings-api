import { PgClient } from '../../../utils/pgClient';
import { AgencyRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { BookingStatus } from '../../../../src/models';
import * as request from 'request';
import { BookingValidationType } from '../../../../src/models/bookingValidationType';
import { populateUserServiceProvider } from '../../../populate/V2/users';
import { populateIndividualTimeslot } from '../../../populate/V2/servieProviders';

describe('Bookings functional tests as agency', () => {
	const pgClient = new PgClient();
	const startDateTime = new Date(Date.UTC(2051, 11, 10, 0, 0));
	const endDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
	const citizenUinFin = 'S7429377H';
	const citizenName = 'Jane';
	const citizenEmail = 'jane@email.com';
	const phoneNumber = '123456789';
	const location = 'Singapore';
	const videoConferenceLink = 'www.google.com';
	const description =
		'Lorem ipsum dolor sit amet, !@#$%^&*()-+? adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
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
			serviceNames: [NAME_SERVICE_1],
			name: SERVICE_PROVIDER_NAME_1,
			agencyUserId: 'A001',
		});
		serviceProviderId = result.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1).id;
		serviceId = result.services.find((item) => item.name === NAME_SERVICE_1).id;
		done();
	});

	const createInSlotBooking = async (): Promise<request.Response> => {
		await populateIndividualTimeslot(serviceProviderId, {
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

	it('agency should be able to create out of slot booking with accepted status', async () => {
		const response = await AgencyRequestEndpointSG.create({
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
					phoneNumber,
					location,
					videoConferenceLink,
					description,
					validationType,
				},
			},
			'V2',
		);
		expect(response.statusCode).toEqual(201);
		expect(typeof response.body.data.id).toBe('string');
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});

	it('agency should create booking in provided slot with accepted status', async () => {
		const response = await createInSlotBooking();
		expect(response.statusCode).toEqual(201);
		expect(typeof response.body.data.id).toBe('string');
		expect(response.body.data.status).toBe(BookingStatus.Accepted);
	});
});
