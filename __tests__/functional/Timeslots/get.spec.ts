import { PgClient } from '../../utils/pgClient';
import {
	CitizenRequestEndpointSG,
	OrganisationAdminRequestEndpointSG,
	ServiceAdminRequestEndpointSG,
	ServiceProviderRequestEndpointSG,
} from '../../utils/requestEndpointSG';
import { populateOneOffTimeslot, populateUserServiceProvider, populateWeeklyTimesheet } from '../../populate/basic';
import { keepTimeFromTimezoneToLocal } from '../../../__tests__/utils/dateTimeUtil';
import { LabelRequestModel } from '../../../src/components/labels/label.apicontract';

describe('Timeslots functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const NAME_SERVICE_2 = 'service2';
	const NAME_SERVICE_3 = 'service3';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	const SERVICE_PROVIDER_NAME_2 = 'SP2';
	const SERVICE_PROVIDER_NAME_3 = 'SP3';
	const START_TIME_1 = '09:00';
	const END_TIME_1 = '10:00';
	const START_TIME_2 = '11:00';
	const END_TIME_2 = '12:00';
	const START_TIME_3 = '13:00';
	const END_TIME_3 = '14:00';
	const ERROR_MESSAGE = 'An unexpected error has occurred.';
	const TIME_FORMAT = 'HH:mm';
	const ONE_OFF_START_TIME_1 = new Date('2021-03-05T01:00:00Z');
	const ONE_OFF_END_TIME_1 = new Date('2021-03-05T02:00:00Z');

	const labels: LabelRequestModel[] = [];
	const label = new LabelRequestModel;
	label.label = 'Chinese';
	labels.push(label);
	
	let result1;
	let result2;
	let result3;
	let serviceProvider1;
	let serviceProvider2;
	let serviceProvider3;
	let serviceId1;
	let serviceId2;
	let serviceId3;

	afterAll(async (done) => {
		//await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();

		result1 = await populateUserServiceProvider({
			nameService: NAME_SERVICE_1,
			serviceProviderName: SERVICE_PROVIDER_NAME_1,
			agencyUserId: 'A001',
		});
		result2 = await populateUserServiceProvider({
			nameService: NAME_SERVICE_2,
			serviceProviderName: SERVICE_PROVIDER_NAME_2,
			agencyUserId: 'A002',
		});
		result3 = await populateUserServiceProvider({
			nameService: NAME_SERVICE_3,
			serviceProviderName: SERVICE_PROVIDER_NAME_3,
			agencyUserId: 'A003',
		});

		serviceProvider1 = result1.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1);
		serviceProvider2 = result2.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_2);
		serviceProvider3 = result3.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_3);

		serviceId1 = result1.services.find((item) => item.name === NAME_SERVICE_1).id;
		serviceId2 = result2.services.find((item) => item.name === NAME_SERVICE_2).id;
		serviceId3 = result3.services.find((item) => item.name === NAME_SERVICE_3).id;

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

		await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: ONE_OFF_START_TIME_1,
			endTime: ONE_OFF_END_TIME_1,
			capacity: 1,
			labels: labels,
		});

		done();
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

	it('should return labels', async () => {
		const timeslotsForServiceProviders = await OrganisationAdminRequestEndpointSG.create({
			serviceId: serviceId1,
		}).get(`timeslots?startDate=2021-03-03T09:00:00.000Z&endDate=2021-03-06T09:59:59.999Z&includeBookings=true`);
	
		expect(timeslotsForServiceProviders.statusCode).toEqual(200);

		console.log('==================================================',);
		console.log(require('util').inspect(timeslotsForServiceProviders, false, null, true /* enable colors */));
		console.log('==================================================',);

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
		} catch (e) {
			expect(e.message).toBe(ERROR_MESSAGE);
		}

		try {
			await CitizenRequestEndpointSG.create({ serviceId: serviceId2 }).get(
				`/service-providers/${serviceProvider2.id}/timeslotSchedule`,
			);
		} catch (e) {
			expect(e.message).toBe(ERROR_MESSAGE);
		}

		try {
			await CitizenRequestEndpointSG.create({ serviceId: serviceId3 }).get(
				`/service-providers/${serviceProvider3.id}/timeslotSchedule`,
			);
		} catch (e) {
			expect(e.message).toBe(ERROR_MESSAGE);
		}
	});
});
