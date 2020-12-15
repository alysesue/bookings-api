import { PgClient } from '../../utils/pgClient';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import {
	populateServiceAndServiceProvider,
	populateIndividualTimeslot
} from '../../Populate/basic';

describe('Bookings functional tests as admin', () => {
	const pgClient = new PgClient();
	const startDateTime = new Date(2020, 12, 6, 8, 0);
	const endDateTime = new Date(2020, 12, 6, 9, 0);
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

	it('admin should be able to create out of slot booking', async () => {
		const adminCreateBookingOos = await OrganisationAdminRequestEndpointSG.create({ serviceId: result.service.id }).post(`/bookings/admin`, { body: { startDateTime: startDateTime, endDateTime: endDateTime, serviceProviderId: result.serviceProvider[0].id, citizenUinFin, citizenName, citizenEmail } });
		expect(adminCreateBookingOos.statusCode).toEqual(201);
	});

	it('admin should create booking in provided slot', async () => {
		await populateIndividualTimeslot({ serviceProviderId: result.serviceProvider[0].id, weekDay: 0, startTime: "08:00", endTime: "09:00", capacity: 1 });

		const adminCreateBooking = await OrganisationAdminRequestEndpointSG.create({ serviceId: result.service.id }).post(`/bookings/admin`, { body: { startDateTime, endDateTime, serviceProviderId: result.serviceProvider[0].id, citizenUinFin, citizenName, citizenEmail } });
		expect(adminCreateBooking.statusCode).toEqual(201);
	});
});
