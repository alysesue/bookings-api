import { PgClient } from '../../utils/pgClient';
import {
	CitizenRequestEndpointSG,
	OrganisationAdminRequestEndpointSG,
	ServiceAdminRequestEndpointSG,
	ServiceProviderRequestEndpointSG,
} from '../../utils/requestEndpointSG';
import { populateIndividualTimeslot, populateUserServiceProvider } from '../../Populate/basic';

describe('Timeslots functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const NAME_SERVICE_2 = 'service2';
	const NAME_SERVICE_3 = 'service3';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	const SERVICE_PROVIDER_NAME_2 = 'SP2';
	const SERVICE_PROVIDER_NAME_3 = 'SP3';
	const WEEKDAY = 0;
	const START_TIME_1 = '09:00';
	const END_TIME_1 = '10:00';
	const START_TIME_2 = '11:00';
	const END_TIME_2 = '12:00';
	const START_TIME_3 = '13:00';
	const END_TIME_3 = '14:00';
	const CAPACITY = 2;
	const ERROR_MESSAGE = 'An unexpected error has occurred.';
	let result1;
	let result2;
	let result3;
	let serviceProvider1;
	let serviceProvider2;
	let serviceProvider3;
	let serviceId1;
	let serviceId2;
	let serviceId3;

	beforeAll(async () => {
		await pgClient.cleanAllTables();
	});
	afterAll(async () => {
		await pgClient.close();
	});

	beforeEach(async () => {
		result1 = await populateUserServiceProvider({
			nameService: NAME_SERVICE_1,
			serviceProviderName: SERVICE_PROVIDER_NAME_1,
		});
		result2 = await populateUserServiceProvider({
			nameService: NAME_SERVICE_2,
			serviceProviderName: SERVICE_PROVIDER_NAME_2,
		});
		result3 = await populateUserServiceProvider({
			nameService: NAME_SERVICE_3,
			serviceProviderName: SERVICE_PROVIDER_NAME_3,
		});

		serviceProvider1 = result1.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1);
		serviceProvider2 = result2.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_2);
		serviceProvider3 = result3.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_3);

		serviceId1 = result1.services.find((item) => item.name === NAME_SERVICE_1).id;
		serviceId2 = result2.services.find((item) => item.name === NAME_SERVICE_2).id;
		serviceId3 = result3.services.find((item) => item.name === NAME_SERVICE_3).id;

		await populateIndividualTimeslot({
			serviceProviderId: serviceProvider1.id,
			weekDay: WEEKDAY,
			startTime: START_TIME_1,
			endTime: END_TIME_1,
			capacity: CAPACITY,
		});
		await populateIndividualTimeslot({
			serviceProviderId: serviceProvider2.id,
			weekDay: WEEKDAY,
			startTime: START_TIME_2,
			endTime: END_TIME_2,
			capacity: CAPACITY,
		});
		await populateIndividualTimeslot({
			serviceProviderId: serviceProvider3.id,
			weekDay: WEEKDAY,
			startTime: START_TIME_3,
			endTime: END_TIME_3,
			capacity: CAPACITY,
		});
	});

	afterEach(async () => {
		await pgClient.cleanAllTables();
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

	it('service admin should only get timeslot schedules for their service', async () => {
		const service1TimeslotsResponse = await ServiceAdminRequestEndpointSG.create({
			nameService: NAME_SERVICE_1,
			serviceId: serviceId1,
		}).get(`/service-providers/${serviceProvider1.id}/timeslotSchedule`);

		expect(service1TimeslotsResponse.statusCode).toEqual(200);
		expect(service1TimeslotsResponse.body.data.timeslots[0].startTime).toEqual(START_TIME_1);
		expect(service1TimeslotsResponse.body.data.timeslots[0].endTime).toEqual(END_TIME_1);

		try {
			await ServiceAdminRequestEndpointSG.create({
				nameService: NAME_SERVICE_1,
				serviceId: serviceId1,
			}).get(`/service-providers/${serviceProvider2}/timeslotSchedule`);
			await ServiceAdminRequestEndpointSG.create({
				nameService: NAME_SERVICE_1,
				serviceId: serviceId1,
			}).get(`/service-providers/${serviceProvider3}/timeslotSchedule`);
		} catch (e) {
			expect(e.message).toBe(ERROR_MESSAGE);
		}
	});

	it('service provider should only get their timeslot schedule', async () => {
		const molAdaminId = await pgClient.getMolAdminIdWithAgencyUserId(serviceProvider1.agencyUserId);
		const service1TimeslotsResponse = await ServiceProviderRequestEndpointSG.create({
			nameService: NAME_SERVICE_1,
			serviceId: serviceId1,
			molAdminId: molAdaminId,
		}).get(`/service-providers/${serviceProvider1.id}/timeslotSchedule`);
		expect(service1TimeslotsResponse.statusCode).toEqual(200);
		expect(service1TimeslotsResponse.body.data.timeslots[0].startTime).toEqual(START_TIME_1);
		expect(service1TimeslotsResponse.body.data.timeslots[0].endTime).toEqual(END_TIME_1);

		try {
			await ServiceProviderRequestEndpointSG.create({
				nameService: NAME_SERVICE_1,
				serviceId: serviceId1,
			}).get(`/service-providers/${serviceProvider2.id}/timeslotSchedule`);
			await ServiceProviderRequestEndpointSG.create({
				nameService: NAME_SERVICE_1,
				serviceId: serviceId1,
			}).get(`/service-providers/${serviceProvider3.id}/timeslotSchedule`);
		} catch (e) {
			expect(e.message).toBe(ERROR_MESSAGE);
		}
	});

	it('citizen should not get any timeslot schedules', async () => {
		try {
			await CitizenRequestEndpointSG.create({ serviceId: serviceId1 }).get(
				`/service-providers/${serviceProvider1.id}/timeslotSchedule`,
			);
			await CitizenRequestEndpointSG.create({ serviceId: serviceId2 }).get(
				`/service-providers/${serviceProvider2.id}/timeslotSchedule`,
			);
			await CitizenRequestEndpointSG.create({ serviceId: serviceId3 }).get(
				`/service-providers/${serviceProvider3.id}/timeslotSchedule`,
			);
		} catch (e) {
			expect(e.message).toBe(ERROR_MESSAGE);
		}
	});
});
