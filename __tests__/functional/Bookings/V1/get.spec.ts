import { PgClient } from '../../../utils/pgClient';
import * as request from 'request';

import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { populateUserServiceProvider } from '../../../populate/V1/users';
import { populateIndividualTimeslot } from '../../../populate/V1/serviceProviders';

describe('Bookings functional tests', () => {
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
		// eslint-disable-next-line max-len
		'Lorem ipsum dolor sit amet !@#$%^&*()-+? adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum.';
	const NAME_SERVICE_1 = 'service1';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	let serviceProviderId: number;
	let serviceId: number;

	const SERVICE_PROVIDER_NAME_2 = 'SP2';
	let serviceProviderId2: number;

	const SERVICE_PROVIDER_NAME_3 = 'SP3';
	let serviceProviderId3: number;

	afterAll(async () => {
		await pgClient.cleanAllTables();
		await pgClient.close();
	});

	beforeEach(async () => {
		await pgClient.cleanAllTables();
		const result = await populateUserServiceProvider({
			serviceNames: [NAME_SERVICE_1],
			name: SERVICE_PROVIDER_NAME_1,
			agencyUserId: 'A001',
		});
		serviceProviderId = result.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1).id;
		serviceId = result.services.find((item) => item.name === NAME_SERVICE_1).id;
		const result2 = await populateUserServiceProvider({
			serviceNames: [NAME_SERVICE_1],
			name: SERVICE_PROVIDER_NAME_2,
			agencyUserId: 'A002',
		});

		serviceProviderId2 = result2.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_2).id;

		const result3 = await populateUserServiceProvider({
			serviceNames: [NAME_SERVICE_1],
			name: SERVICE_PROVIDER_NAME_3,
			agencyUserId: 'A003',
		});
		serviceProviderId3 = result3.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_3).id;
	});

	const createInSlotBooking = async (): Promise<request.Response> => {
		await populateIndividualTimeslot(serviceProviderId, {
			weekDay: 0,
			startTime: '08:00',
			endTime: '09:00',
			capacity: 1,
		});

		await populateIndividualTimeslot(serviceProviderId2, {
			weekDay: 0,
			startTime: '08:00',
			endTime: '09:00',
			capacity: 1,
		});

		await populateIndividualTimeslot(serviceProviderId3, {
			weekDay: 0,
			startTime: '08:00',
			endTime: '09:00',
			capacity: 1,
		});

		return await OrganisationAdminRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).post(`/bookings/admin`, {
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
		});
	};

	describe('bookings/csv', () => {
		it('should get bookings as csv', async () => {
			await createInSlotBooking();
			await createInSlotBooking();

			const response = await OrganisationAdminRequestEndpointSG.create({
				serviceId: `${serviceId}`,
			}).get(`/bookings/csv`, {});

			const bodyLength = response.body.split('\n').length;
			const contentDisposition = response.headers['content-disposition'];
			const contentType = response.headers['content-type'];

			expect(response.statusCode).toBe(200);
			expect(bodyLength).toEqual(4);
			expect(contentDisposition).toEqual(`attachment; filename="exported-bookings.csv"`);
			expect(contentType).toEqual(`text/csv`);
		});

		it('should return correct information in csv', async () => {
			await createInSlotBooking();

			const response = await OrganisationAdminRequestEndpointSG.create({
				serviceId: `${serviceId}`,
			}).get(`/bookings/csv`, {});

			const body = response.body.split('\n');
			const csvHeaders = body[0];
			const fields = body[1].split(',');

			expect(csvHeaders).toEqual(
				`Booking ID,Booking Status,Booking creation date,Booking service start date/time,Booking service end date/time,Booking location,Booking description,Booking reference,Dynamic Fields,Citizen NRIC / FIN number,Citizen Salutation,Citizen Name,Citizen Email address,Citizen Phone number,Service Name,Service Provider Name,Service Provider Email address,Service Provider Phone number`,
			);
			expect(fields[1]).toEqual('Accepted');
			expect(new Date(fields[3])).toEqual(startDateTime);
			expect(new Date(fields[4])).toEqual(endDateTime);
			expect(fields[5]).toEqual(location);
			expect(fields[6]).toEqual(description);
			expect(fields[9]).toEqual('S****377H');
			expect(fields[11]).toEqual(citizenName);
			expect(fields[12]).toEqual(citizenEmail);
			expect(fields[14]).toEqual(NAME_SERVICE_1);
			expect(fields[15]).toEqual(SERVICE_PROVIDER_NAME_1);
			expect(fields[17]).toEqual('+6580000000');
		});
	});

	it('should get all bookings with limit', async () => {
		for (let i = 0; i < 7; i++) {
			await createInSlotBooking();
		}

		const response = await OrganisationAdminRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).get(`/bookings`, {
			params: { limit: 6 },
		});

		expect(response.statusCode).toBe(200);
		const dataLength = response.body.data.length;
		expect(dataLength).toEqual(6);
	});

	it('should get all bookings with default limit', async () => {
		for (let i = 0; i < 7; i++) {
			await createInSlotBooking();
		}

		const response = await OrganisationAdminRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		}).get(`/bookings`, {});

		expect(response.statusCode).toBe(200);
		const dataLength = response.body.data.length;
		expect(dataLength).toEqual(7);
	});

	it('should get booking by booking id', async () => {
		const res = await createInSlotBooking();
		const resId = res.body.data.id;
		const response = await OrganisationAdminRequestEndpointSG.create({}).get(`/bookings/${resId}`, {});
		const bookingId = response.body.data.id;

		expect(response.statusCode).toBe(200);
		expect(resId).toEqual(bookingId);
	});

	it('should get a list of available service providers for this booking timeslot', async () => {
		const res = await createInSlotBooking();
		const resId = res.body.data.id;
		const response = await OrganisationAdminRequestEndpointSG.create({}).get(`/bookings/${resId}/providers`, {});
		const spLength = response.body.data.length;

		expect(response.statusCode).toBe(200);
		expect(spLength).toEqual(2);
	});

	it('should get booking by uuid', async () => {
		const res = await createInSlotBooking();
		const resUUID = res.body.data.uuid;

		const response = await OrganisationAdminRequestEndpointSG.create({}).get(`/bookings/uuid/${resUUID}`, {});
		expect(response.statusCode).toBe(200);
		expect(response.body.data.serviceId).toEqual(serviceId);
		expect(response.body.data.serviceProviderId).toEqual(serviceProviderId);
	});
});
