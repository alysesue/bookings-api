import { PgClient } from '../../../utils/pgClient';
import {
	CitizenRequestEndpointSG,
	OrganisationAdminRequestEndpointSG,
	ServiceAdminRequestEndpointSG,
	ServiceProviderRequestEndpointSG,
} from '../../../utils/requestEndpointSG';
import { keepTimeFromTimezoneToLocal } from '../../../utils/dateTimeUtil';
import { populateUserServiceProvider } from '../../../populate/V1/users';
import { populateWeeklyTimesheet } from '../../../populate/V1/serviceProviders';

describe('Timeslots functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const NAME_SERVICE_2 = 'service2';
	const NAME_SERVICE_3 = 'service3';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	const SERVICE_PROVIDER_NAME_2 = 'SP2';
	const SERVICE_PROVIDER_NAME_3 = 'SP3';
	const SERVICE_PROVIDER_NAME_4 = 'SP4';
	const START_TIME_1 = '09:00';
	const END_TIME_1 = '10:00';
	const START_TIME_2 = '11:00';
	const END_TIME_2 = '12:00';
	const START_TIME_3 = '13:00';
	const END_TIME_3 = '14:00';
	const TIME_FORMAT = 'HH:mm';

	let result1;
	let result2;
	let result3;
	let serviceProvider1;
	let serviceProvider2;
	let serviceProvider3;
	let serviceProvider4;
	let serviceId1;
	let serviceId2;
	let serviceId3;

	afterAll(async () => {
		await pgClient.cleanAllTables();
		await pgClient.close();
	});

	beforeEach(async () => {
		await pgClient.cleanAllTables();

		result1 = await populateUserServiceProvider({
			serviceNames: [NAME_SERVICE_1],
			name: SERVICE_PROVIDER_NAME_1,
			agencyUserId: 'A001',
		});
		result2 = await populateUserServiceProvider({
			serviceNames: [NAME_SERVICE_2],
			name: SERVICE_PROVIDER_NAME_2,
			agencyUserId: 'A002',
		});
		result3 = await populateUserServiceProvider({
			serviceNames: [NAME_SERVICE_3],
			name: SERVICE_PROVIDER_NAME_3,
			agencyUserId: 'A003',
		});

		serviceProvider1 = result1.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1);
		serviceProvider2 = result2.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_2);
		serviceProvider3 = result3.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_3);

		serviceId1 = result1.services.find((item) => item.name === NAME_SERVICE_1).id;
		serviceId2 = result2.services.find((item) => item.name === NAME_SERVICE_2).id;
		serviceId3 = result3.services.find((item) => item.name === NAME_SERVICE_3).id;

		serviceProvider4 = OrganisationAdminRequestEndpointSG.create({ serviceId: serviceId1 }).post(
			'/service-providers',
			{
				body: {
					serviceProviders: [
						{
							name: SERVICE_PROVIDER_NAME_4,
						},
					],
				},
			},
		);

		await populateWeeklyTimesheet({
			serviceProviderId: serviceProvider1.id,
			openTime: START_TIME_1,
			closeTime: END_TIME_1,
			scheduleSlot: 60,
		});
		await populateWeeklyTimesheet({
			serviceProviderId: serviceProvider2.id,
			openTime: START_TIME_2,
			closeTime: END_TIME_2,
			scheduleSlot: 60,
		});
		await populateWeeklyTimesheet({
			serviceProviderId: serviceProvider3.id,
			openTime: START_TIME_3,
			closeTime: END_TIME_3,
			scheduleSlot: 60,
		});
	});

	it('organisation admin should get all timeslot schedules', async () => {
		const service1TimeslotsResponse = await OrganisationAdminRequestEndpointSG.create({}).get(
			`/service-providers/${serviceProvider1.id}/timeslotSchedule`,
		);
		const service2TimeslotsResponse = await OrganisationAdminRequestEndpointSG.create({}).get(
			`/service-providers/${serviceProvider2.id}/timeslotSchedule`,
		);
		const service3TimeslotsResponse = await OrganisationAdminRequestEndpointSG.create({}).get(
			`/service-providers/${serviceProvider3.id}/timeslotSchedule`,
		);

		expect(service1TimeslotsResponse.statusCode).toEqual(200);
		expect(service1TimeslotsResponse.body.data.timeslots[0].startTime).toEqual(START_TIME_1);
		expect(service1TimeslotsResponse.body.data.timeslots[0].endTime).toEqual(END_TIME_1);

		expect(service2TimeslotsResponse.statusCode).toEqual(200);
		expect(service2TimeslotsResponse.body.data.timeslots[0].startTime).toEqual(START_TIME_2);
		expect(service2TimeslotsResponse.body.data.timeslots[0].endTime).toEqual(END_TIME_2);

		expect(service3TimeslotsResponse.statusCode).toEqual(200);
		expect(service3TimeslotsResponse.body.data.timeslots[0].startTime).toEqual(START_TIME_3);
		expect(service3TimeslotsResponse.body.data.timeslots[0].endTime).toEqual(END_TIME_3);
	});

	it('organization admin should get all timeslot schedules for specific service provider', async () => {
		const timeslotsForServiceProviders = await OrganisationAdminRequestEndpointSG.create({
			serviceId: serviceId1,
		}).get(`timeslots?startDate=2020-11-27T09:00:00.000Z&endDate=2020-11-30T09:59:59.999Z&includeBookings=true`);

		expect(timeslotsForServiceProviders.statusCode).toEqual(200);

		const startDate = timeslotsForServiceProviders.body.data[0].startTime;
		const endDate = timeslotsForServiceProviders.body.data[0].endTime;

		const startTime = keepTimeFromTimezoneToLocal({ date: startDate, format: TIME_FORMAT });
		const endTime = keepTimeFromTimezoneToLocal({ date: endDate, format: TIME_FORMAT });
		expect(startTime).toEqual(START_TIME_1);
		expect(endTime).toEqual(END_TIME_1);
	});

	it('service admin should only get timeslot schedules for their service', async () => {
		const service1TimeslotsResponse = await ServiceAdminRequestEndpointSG.create({
			nameService: NAME_SERVICE_1,
			serviceId: serviceId1,
		}).get(`/service-providers/${serviceProvider1.id}/timeslotSchedule`);

		expect(service1TimeslotsResponse.statusCode).toEqual(200);
		expect(service1TimeslotsResponse.body.data.timeslots[0].startTime).toEqual(START_TIME_1);
		expect(service1TimeslotsResponse.body.data.timeslots[0].endTime).toEqual(END_TIME_1);

		const response1 = await ServiceAdminRequestEndpointSG.create({
			nameService: NAME_SERVICE_1,
			serviceId: serviceId1,
		}).get(`/service-providers/${serviceProvider2.id}/timeslotSchedule`);
		const response2 = await ServiceAdminRequestEndpointSG.create({
			nameService: NAME_SERVICE_1,
			serviceId: serviceId1,
		}).get(`/service-providers/${serviceProvider3.id}/timeslotSchedule`);

		expect(response1.statusCode).toEqual(404);
		expect(response2.statusCode).toEqual(404);
	});

	it('service provider should only get their timeslot schedule', async () => {
		const molAdminId = await pgClient.getAdminIdForServiceProvider({
			serviceProviderId: serviceProvider1.id,
		});

		const service1TimeslotsResponse = await ServiceProviderRequestEndpointSG.create({
			nameService: NAME_SERVICE_1,
			serviceId: serviceId1,
			molAdminId,
		}).get(`/service-providers/${serviceProvider1.id}/timeslotSchedule`);
		expect(service1TimeslotsResponse.statusCode).toEqual(200);
		expect(service1TimeslotsResponse.body.data.timeslots[0].startTime).toEqual(START_TIME_1);
		expect(service1TimeslotsResponse.body.data.timeslots[0].endTime).toEqual(END_TIME_1);

		const response1 = await ServiceProviderRequestEndpointSG.create({
			nameService: NAME_SERVICE_1,
			serviceId: serviceId1,
			molAdminId,
		}).get(`/service-providers/${serviceProvider3.id}/timeslotSchedule`, {}, 'V2');
		const response2 = await ServiceProviderRequestEndpointSG.create({
			nameService: NAME_SERVICE_1,
			serviceId: serviceId1,
			molAdminId,
		}).get(`/service-providers/${serviceProvider4.id}/timeslotSchedule`, {}, 'V2');

		expect(response1.statusCode).toEqual(404);
		expect(response2.statusCode).toEqual(404);
	});

	it('citizen should not get any timeslot schedules', async () => {
		const response1 = await CitizenRequestEndpointSG.create({ serviceId: serviceId1 }).get(
			`/service-providers/${serviceProvider1.id}/timeslotSchedule`,
		);
		const response2 = await CitizenRequestEndpointSG.create({ serviceId: serviceId2 }).get(
			`/service-providers/${serviceProvider2.id}/timeslotSchedule`,
		);
		const response3 = await CitizenRequestEndpointSG.create({ serviceId: serviceId3 }).get(
			`/service-providers/${serviceProvider3.id}/timeslotSchedule`,
		);

		expect(response1.statusCode).toEqual(403);
		expect(response2.statusCode).toEqual(403);
		expect(response3.statusCode).toEqual(403);
	});
});
