import { PgClient } from '../../utils/pgClient';
import { CitizenRequestEndpointSG, OrganisationAdminRequestEndpointSG} from '../../utils/requestEndpointSG';
import {
	populateOutOfSlotBooking,
	populateServiceAndServiceProvider
} from '../../Populate/basic';

describe('Bookings functional tests', () => {
	const pgClient = new PgClient();
	const date = new Date();
	const startDateTime = new Date(date.setUTCDate(date.getUTCDate() + 1));
	const endDateTime = new Date(date.setUTCDate(date.getUTCDate() + 2));
	const citizenUinFin = 'G3382058K';
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

	it('admin should be able to create out of slot booking', async () => {
		const adminCreateBookingOos = await OrganisationAdminRequestEndpointSG.create({ serviceId: result.serviceId }).post(`/bookings/admin`, { body: { startDateTime, endDateTime, serviceProviderId: result.serviceProviderId, citizenUinFin, citizenName, citizenEmail } });
		expect(adminCreateBookingOos.statusCode).toEqual(201);
	});

	it('admin should create out of slot booking and citizen cancels a booking', async() => {
        const bookingId = await populateOutOfSlotBooking({startDateTime, endDateTime, serviceId: result.serviceId, serviceProviderId: result.serviceProviderId, citizenUinFin, citizenName, citizenEmail});
	    const citizenCancelBookingResponse = await CitizenRequestEndpointSG.create({}).post(`/bookings/${bookingId}/cancel`, {});
	    expect(citizenCancelBookingResponse.statusCode).toEqual(204);
	});
});
