import { PgClient } from '../../utils/pgClient';
import { CitizenRequestEndpointSG } from '../../utils/requestEndpointSG';
import { populateOutOfSlotBooking, populateServiceAndServiceProvider } from '../../Populate/basic';

describe('Bookings functional tests as citizen - out of slots', () => {
	const pgClient = new PgClient();
	const startDateTime = new Date(Date.UTC(2051, 11, 10, 0, 0));
	const endDateTime = new Date(Date.UTC(2051, 11, 10, 1, 0));
	const citizenUinFin = 'S7429377H';
	const citizenName = 'Jane';
	const citizenEmail = 'jane@email.com';
	let result;

	beforeAll(async (done) => {
		await pgClient.cleanAllTables();
		done();
	});

	afterAll(async (done) => {
		await pgClient.close();
		done();
	});

	beforeEach(async (done) => {
		result = await populateServiceAndServiceProvider({});
		done();
	});

	afterEach(async (done) => {
		await pgClient.cleanAllTables();
		done();
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
});
