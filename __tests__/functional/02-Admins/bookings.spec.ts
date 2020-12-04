import { PgClient } from '../../utils/pgClient';
import { AdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { populateServiceAndServiceProvider } from '../../Populate/basic';

describe('Bookings functional tests', () => {
	const pgClient = new PgClient();
	const date = new Date();
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
		const adminCreateBookingOos = await AdminRequestEndpointSG.create({ serviceId: result.serviceId }).post(`/bookings/admin`, { body: { startDateTime: "2020-12-31T06:00:00.000Z", endDateTime: "2020-12-31T07:00:00.000Z", serviceProviderId: result.serviceProviderId, citizenUinFin: "S0642728F", citizenName: "S0642728F", citizenEmail: "S0642728F@mail.com" } });
		expect(adminCreateBookingOos.statusCode).toEqual(201);
	});
});
