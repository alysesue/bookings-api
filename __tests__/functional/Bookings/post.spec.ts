import { PgClient } from '../../utils/pgClient';
import { CitizenRequestEndpointSG, OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import {
	populateIndividualTimeslot,
	populateOutOfSlotBooking,
	populateServiceAndServiceProvider,
} from '../../Populate/basic';

describe('Bookings functional tests as citizen - out of slots', () => {
	const pgClient = new PgClient();
	const startDateTime = new Date(Date.UTC(2051, 11, 10, 0, 0));
	const endDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
	const citizenUinFin = 'S7429377H';
	const citizenName = 'Jane';
	const citizenEmail = 'jane@email.com';
	let result;

	beforeAll(async () => {
		await pgClient.cleanAllTables();
	});

	afterAll(async () => {
		await pgClient.close();
	});

	beforeEach(async () => {
		result = await populateServiceAndServiceProvider({});
	});

	afterEach(async () => {
		await pgClient.cleanAllTables();
	});

	it('admin should create out of slot booking and citizen cancels a booking', async () => {
		const bookingId = await populateOutOfSlotBooking({
			startDateTime,
			endDateTime,
			serviceId: result.service.id,
			serviceProviderId: result.serviceProvider[0].id,
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

	it('citizen should create booking in provided slot', async () => {
		await populateIndividualTimeslot({
			serviceProviderId: result.serviceProvider[0].id,
			weekDay: 0,
			startTime: '08:00',
			endTime: '09:00',
			capacity: 1,
		});

		const citizenCreateBooking = await CitizenRequestEndpointSG.create({
			serviceId: result.service.id,
		}).post(`/bookings`, {
			body: {
				token: '123321token',
				startDateTime,
				endDateTime,
				serviceProviderId: result.serviceProvider[0].id,
				citizenUinFin,
				citizenName,
				citizenEmail,
			},
		});
		expect(citizenCreateBooking.statusCode).toEqual(201);
		const adminCreateBookingOos = await OrganisationAdminRequestEndpointSG.create({
			serviceId: result.service.id,
		}).post(`/bookings/admin`, {
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId: result.serviceProvider[0].id,
				citizenUinFin,
				citizenName,
				citizenEmail,
			},
		});
		expect(adminCreateBookingOos.statusCode).toEqual(201);
	});
});
