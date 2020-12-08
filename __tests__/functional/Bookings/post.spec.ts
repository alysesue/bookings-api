import { PgClient } from '../../utils/pgClient';
import { CitizenRequestEndpointSG, OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import {
	populateOutOfSlotBooking,
	populateServiceAndServiceProvider,
	populateIndividualTimeslot
} from '../../Populate/basic';

describe('Bookings functional tests - out of slots', () => {
	const pgClient = new PgClient();
	const startDateTime = new Date(2020, 12, 6, 8, 0);
	const endDateTime = new Date(2020, 12, 6, 9, 0);
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
		const adminCreateBookingOos = await OrganisationAdminRequestEndpointSG.create({ serviceId: result.serviceId }).post(`/bookings/admin`, { body: { startDateTime: startDateTime, endDateTime: endDateTime, serviceProviderId: result.serviceProviderId, citizenUinFin, citizenName, citizenEmail } });
		expect(adminCreateBookingOos.statusCode).toEqual(201);
	});

	it('admin should create out of slot booking and citizen cancels that booking', async () => {
		const bookingId = await populateOutOfSlotBooking({ startDateTime: startDateTime, endDateTime: endDateTime, serviceId: result.serviceId, serviceProviderId: result.serviceProviderId, citizenUinFin, citizenName, citizenEmail });
		const citizenCancelBookingResponse = await CitizenRequestEndpointSG.create({}).post(`/bookings/${bookingId}/cancel`, {});
		expect(citizenCancelBookingResponse.statusCode).toEqual(204);
	});

});

describe('Bookings functional tests - with provided slots', () => {
	const pgClient = new PgClient();
	const date = new Date();
	const startDateTime = new Date(2020, 12, 6, 8, 0);
	const endDateTime = new Date(2020, 12, 6, 9, 0);
	const citizenUinFin = 'G3382058K';
	const citizenName = 'Jane';
	const citizenEmail = 'jane@email.com';
	let result;
	let slots;

	beforeAll(async () => {
		await pgClient.cleanAllTables();
	});

	afterAll(async () => {
		await pgClient.close();
	});

	beforeEach(async () => {
		result = await populateServiceAndServiceProvider({});
		slots = await populateIndividualTimeslot({ serviceProviderId: result.serviceProvider.id, weekDay: 0, startTime: "08:00", endTime: "09:00", capacity: 1 });
	});

	afterEach(async () => {
		await pgClient.cleanAllTables();
	});


	it('admin should create booking in provided slot', async () => {
		const adminCreateBooking = await OrganisationAdminRequestEndpointSG.create({ serviceId: result.serviceId }).post(`/bookings/admin`, { body: { startDateTime, endDateTime, serviceProviderId: result.serviceProviderId, citizenUinFin, citizenName, citizenEmail } });
		expect(adminCreateBooking.statusCode).toEqual(201);
	});

});
