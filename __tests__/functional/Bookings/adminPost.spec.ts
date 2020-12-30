import { PgClient } from '../../utils/pgClient';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { populateIndividualTimeslot, populateServiceAndServiceProvider } from '../../Populate/basic';

describe('Bookings functional tests as admin', () => {
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

	it('admin should be able to create out of slot booking', async () => {
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

	it('admin should create booking in provided slot', async () => {
		await populateIndividualTimeslot({
			serviceProviderId: result.serviceProvider[0].id,
			weekDay: 0,
			startTime: '08:00',
			endTime: '09:00',
			capacity: 1,
		});

		const adminCreateBooking = await OrganisationAdminRequestEndpointSG.create({
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
		expect(adminCreateBooking.statusCode).toEqual(201);
	});
});
