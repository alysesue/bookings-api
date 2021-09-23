import { PgClient } from '../../utils/pgClient';
import {
	CitizenRequestEndpointSG,
	OrganisationAdminRequestEndpointSG,
	ServiceAdminRequestEndpointSG,
	ServiceProviderRequestEndpointSG,
} from '../../utils/requestEndpointSG';
import { populateOneOffTimeslot, populateServiceLabel, populateUserServiceProvider } from '../../populate/basic';
import { ServiceProviderResponseModelV1 } from '../../../src/components/serviceProviders/serviceProviders.apicontract';
import { ServiceResponseV1 } from '../../../src/components/services/service.apicontract';
import { TimeslotEntryResponseV1 } from '../../../src/components/timeslots/timeslots.apicontract';

// tslint:disable-next-line: no-big-function
describe('Timeslots functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const NAME_SERVICE_2 = 'service2';
	const NAME_SERVICE_3 = 'service3';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	const SERVICE_PROVIDER_NAME_2 = 'SP2';
	const SERVICE_PROVIDER_NAME_3 = 'SP3';
	const START_TIME_1 = new Date('2021-03-05T01:00:00Z');
	const END_TIME_1 = new Date('2021-03-05T02:00:00Z');
	const START_TIME_2 = new Date('2021-03-06T06:00:00Z');
	const END_TIME_2 = new Date('2021-03-06T07:00:00Z');
	const START_TIME_3 = new Date('2021-03-07T07:00:00Z');
	const END_TIME_3 = new Date('2021-03-07T08:00:00Z');
	const overallStartDate = new Date('2021-03-01T00:00:00Z');
	const overallEndDate = new Date('2021-04-01T00:00:00Z');

	let serviceProvider1: ServiceProviderResponseModelV1;
	let serviceProvider2: ServiceProviderResponseModelV1;
	let serviceProvider3: ServiceProviderResponseModelV1;
	let serviceId1: string;
	let serviceId2: string;
	let serviceId3: string;

	let service1Results: ServiceResponseV1;

	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();

		const result1 = await populateUserServiceProvider({
			nameService: NAME_SERVICE_1,
			serviceProviderName: SERVICE_PROVIDER_NAME_1,
			agencyUserId: 'A001',
		});
		const result2 = await populateUserServiceProvider({
			nameService: NAME_SERVICE_2,
			serviceProviderName: SERVICE_PROVIDER_NAME_2,
			agencyUserId: 'A002',
		});
		const result3 = await populateUserServiceProvider({
			nameService: NAME_SERVICE_3,
			serviceProviderName: SERVICE_PROVIDER_NAME_3,
			agencyUserId: 'A003',
		});

		serviceProvider1 = result1.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1);
		serviceProvider2 = result2.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_2);
		serviceProvider3 = result3.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_3);

		serviceId1 = result1.services.find((item) => item.name === NAME_SERVICE_1).id.toString();
		serviceId2 = result2.services.find((item) => item.name === NAME_SERVICE_2).id.toString();
		serviceId3 = result3.services.find((item) => item.name === NAME_SERVICE_3).id.toString();

		service1Results = await populateServiceLabel({
			serviceId: serviceId1,
			serviceName: NAME_SERVICE_1,
			labels: ['Chinese', 'English', 'Malay'],
		});

		const service2Result = await populateServiceLabel({
			serviceId: serviceId2,
			serviceName: NAME_SERVICE_2,
			labels: ['Chinese', 'English'],
		});

		const service3Result = await populateServiceLabel({
			serviceId: serviceId3,
			serviceName: NAME_SERVICE_3,
			labels: ['Chinese', 'English'],
		});

		await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: START_TIME_1,
			endTime: END_TIME_1,
			capacity: 1,
			labelIds: service1Results.labels.map((l) => l.id),
			title: 'my event',
			description: 'my description',
		});

		await populateOneOffTimeslot({
			serviceProviderId: serviceProvider2.id,
			startTime: START_TIME_2,
			endTime: END_TIME_2,
			capacity: 2,
			labelIds: service2Result.labels.map((l) => l.id),
		});
		await populateOneOffTimeslot({
			serviceProviderId: serviceProvider3.id,
			startTime: START_TIME_3,
			endTime: END_TIME_3,
			capacity: 3,
			labelIds: service3Result.labels.map((l) => l.id),
		});

		done();
	});

	it('one off timeslots should query by label and return empty when not found', async () => {
		const service1TimeslotsResponse = await OrganisationAdminRequestEndpointSG.create({
			serviceId: serviceId1,
		}).get(
			`/timeslots?startDate=${overallStartDate.toISOString()}&endDate=${overallEndDate.toISOString()}&labelIds=English`,
		);

		expect(service1TimeslotsResponse.statusCode).toEqual(200);
		expect(service1TimeslotsResponse.body.data).toEqual([]);
	});

	it('one off timeslots should query by label', async () => {
		const labelId0 = service1Results.labels[0].id;
		const labelId1 = service1Results.labels[1].id;
		const service1TimeslotsResponse = await OrganisationAdminRequestEndpointSG.create({
			serviceId: serviceId1,
		}).get(
			`/timeslots?startDate=${overallStartDate.toISOString()}&endDate=${overallEndDate.toISOString()}&labelIds=${labelId0}&labelIds=${labelId1}`,
		);

		const data = service1TimeslotsResponse.body.data as TimeslotEntryResponseV1[];

		expect(service1TimeslotsResponse.statusCode).toEqual(200);
		expect(data[0].timeslotServiceProviders[0].eventTitle).toBe('my event');
		expect(data[0].timeslotServiceProviders[0].eventDescription).toBe('my description');
		expect(data[0].timeslotServiceProviders[0].labels[0].label).toBe('Chinese');
		expect(data[0].timeslotServiceProviders[0].labels[1].label).toBe('English');
	});

	it('one off timeslots should retrieve labels if applicable', async () => {
		const service1TimeslotsResponse = await OrganisationAdminRequestEndpointSG.create({
			serviceId: serviceId1,
		}).get(`/timeslots?startDate=${overallStartDate.toISOString()}&endDate=${overallEndDate.toISOString()}`);

		expect(service1TimeslotsResponse.statusCode).toEqual(200);
		expect(service1TimeslotsResponse.body.data[0].timeslotServiceProviders[0].labels[0].label).toBe('Chinese');
	});

	it('organisation admin should get all oneoff timeslots', async () => {
		const service1TimeslotsResponse = await OrganisationAdminRequestEndpointSG.create({
			serviceId: serviceId1,
		}).get(`/timeslots?startDate=${overallStartDate.toISOString()}&endDate=${overallEndDate.toISOString()}`);

		const service2TimeslotsResponse = await OrganisationAdminRequestEndpointSG.create({
			serviceId: serviceId2,
		}).get(
			`/timeslots?serviceProviderIds=${
				serviceProvider2.id
			}&startDate=${overallStartDate.toISOString()}&endDate=${overallEndDate.toISOString()}`,
		);

		const service3TimeslotsResponse = await OrganisationAdminRequestEndpointSG.create({
			serviceId: serviceId3,
		}).get(`/timeslots?startDate=${overallStartDate.toISOString()}&endDate=${overallEndDate.toISOString()}`);

		expect(service1TimeslotsResponse.statusCode).toEqual(200);
		expect(service1TimeslotsResponse.body.data[0].startTime).toEqual(START_TIME_1.toISOString());
		expect(service1TimeslotsResponse.body.data[0].endTime).toEqual(END_TIME_1.toISOString());
		expect(service1TimeslotsResponse.body.data[0].timeslotServiceProviders.length).toBe(1);
		expect(service1TimeslotsResponse.body.data[0].timeslotServiceProviders[0].capacity).toBe(1);

		const data2 = service2TimeslotsResponse.body.data as TimeslotEntryResponseV1[];

		expect(service2TimeslotsResponse.statusCode).toEqual(200);
		expect(data2[0].timeslotServiceProviders[0].eventTitle).toBe(undefined);
		expect(data2[0].timeslotServiceProviders[0].eventDescription).toBe(undefined);
		expect(data2[0].startTime).toEqual(START_TIME_2.toISOString());
		expect(data2[0].endTime).toEqual(END_TIME_2.toISOString());
		expect(data2[0].timeslotServiceProviders.length).toBe(1);
		expect(data2[0].timeslotServiceProviders[0].capacity).toBe(2);

		expect(service3TimeslotsResponse.statusCode).toEqual(200);
		expect(service3TimeslotsResponse.body.data[0].startTime).toEqual(START_TIME_3.toISOString());
		expect(service3TimeslotsResponse.body.data[0].endTime).toEqual(END_TIME_3.toISOString());
		expect(service3TimeslotsResponse.body.data[0].timeslotServiceProviders.length).toBe(1);
		expect(service3TimeslotsResponse.body.data[0].timeslotServiceProviders[0].capacity).toBe(3);
	});

	it('service admin should only get timeslots for their service', async () => {
		const serviceAdminEndpoint = ServiceAdminRequestEndpointSG.create({
			nameService: NAME_SERVICE_1,
			serviceId: serviceId1,
		});
		const service1TimeslotsResponse = await serviceAdminEndpoint.get(
			`/timeslots?serviceProviderIds=${
				serviceProvider1.id
			}&startDate=${overallStartDate.toISOString()}&endDate=${overallEndDate.toISOString()}`,
		);

		expect(service1TimeslotsResponse.statusCode).toEqual(200);
		expect(service1TimeslotsResponse.body.data[0].startTime).toEqual(START_TIME_1.toISOString());
		expect(service1TimeslotsResponse.body.data[0].endTime).toEqual(END_TIME_1.toISOString());

		const service2TimeslotsResponse = await serviceAdminEndpoint.get(
			`/timeslots?serviceProviderIds=${
				serviceProvider2.id
			}&startDate=${overallStartDate.toISOString()}&endDate=${overallEndDate.toISOString()}`,
		);
		const service3TimeslotsResponse = await serviceAdminEndpoint.get(
			`/timeslots?serviceProviderIds=${
				serviceProvider3.id
			}&startDate=${overallStartDate.toISOString()}&endDate=${overallEndDate.toISOString()}`,
		);

		expect(service2TimeslotsResponse.statusCode).toEqual(200);
		expect(service2TimeslotsResponse.body.data.length).toBe(0);

		expect(service3TimeslotsResponse.statusCode).toEqual(200);
		expect(service3TimeslotsResponse.body.data.length).toBe(0);
	});

	it('service provider should only get their own timeslots', async () => {
		const molAdminId = await pgClient.getAdminIdForServiceProvider({
			serviceProviderId: serviceProvider1.id,
		});

		const providerEndpoint = ServiceProviderRequestEndpointSG.create({
			nameService: NAME_SERVICE_1,
			serviceId: serviceId1,
			molAdminId,
		});

		const service1TimeslotsResponse = await providerEndpoint.get(
			`/timeslots?serviceProviderIds=${
				serviceProvider1.id
			}&startDate=${overallStartDate.toISOString()}&endDate=${overallEndDate.toISOString()}`,
		);

		const service2TimeslotsResponse = await providerEndpoint.get(
			`/timeslots?serviceProviderIds=${
				serviceProvider2.id
			}&startDate=${overallStartDate.toISOString()}&endDate=${overallEndDate.toISOString()}`,
		);

		const service3TimeslotsResponse = await providerEndpoint.get(
			`/timeslots?serviceProviderIds=${
				serviceProvider3.id
			}&startDate=${overallStartDate.toISOString()}&endDate=${overallEndDate.toISOString()}`,
		);

		expect(service1TimeslotsResponse.statusCode).toEqual(200);
		expect(service1TimeslotsResponse.body.data[0].startTime).toEqual(START_TIME_1.toISOString());
		expect(service1TimeslotsResponse.body.data[0].endTime).toEqual(END_TIME_1.toISOString());

		expect(service2TimeslotsResponse.statusCode).toEqual(200);
		expect(service2TimeslotsResponse.body.data.length).toBe(0);

		expect(service3TimeslotsResponse.statusCode).toEqual(200);
		expect(service3TimeslotsResponse.body.data.length).toBe(0);
	});

	it('citizen should get availability', async () => {
		const availability1Response = await CitizenRequestEndpointSG.create({ serviceId: serviceId1 }).get(
			`/timeslots/availability?serviceProviderId=${
				serviceProvider1.id
			}&startDate=${overallStartDate.toISOString()}&endDate=${overallEndDate.toISOString()}`,
		);

		const availability2Response = await CitizenRequestEndpointSG.create({ serviceId: serviceId2 }).get(
			`/timeslots/availability?serviceProviderId=${
				serviceProvider2.id
			}&startDate=${overallStartDate.toISOString()}&endDate=${overallEndDate.toISOString()}`,
		);

		const availability3Response = await CitizenRequestEndpointSG.create({ serviceId: serviceId3 }).get(
			`/timeslots/availability?serviceProviderId=${
				serviceProvider3.id
			}&startDate=${overallStartDate.toISOString()}&endDate=${overallEndDate.toISOString()}`,
		);

		expect(availability1Response.statusCode).toEqual(200);
		expect(availability1Response.body.data).toEqual([
			{
				availabilityCount: 1,
				startTime: '2021-03-05T01:00:00.000Z',
				endTime: '2021-03-05T02:00:00.000Z',
			},
		]);

		expect(availability2Response.statusCode).toEqual(200);
		expect(availability2Response.body.data).toEqual([
			{
				availabilityCount: 2,
				startTime: '2021-03-06T06:00:00.000Z',
				endTime: '2021-03-06T07:00:00.000Z',
			},
		]);

		expect(availability3Response.statusCode).toEqual(200);
		expect(availability3Response.body.data).toEqual([
			{
				availabilityCount: 3,
				startTime: '2021-03-07T07:00:00.000Z',
				endTime: '2021-03-07T08:00:00.000Z',
			},
		]);
	});

	it('citizen should get availability for exact timeslot', async () => {
		const availability1Response = await CitizenRequestEndpointSG.create({ serviceId: serviceId1 }).get(
			`/timeslots/availability?serviceProviderId=${serviceProvider1.id}&startDate=2021-03-05T01:00:00.000Z&endDate=2021-03-05T02:00:00.000Z&exactTimeslot=true`,
		);

		expect(availability1Response.statusCode).toEqual(200);
		expect(availability1Response.body.data).toEqual([
			{
				availabilityCount: 1,
				startTime: '2021-03-05T01:00:00.000Z',
				endTime: '2021-03-05T02:00:00.000Z',
				timeslotServiceProviders: [
					{
						eventDescription: 'my description',
						eventTitle: 'my event',
						serviceProvider: {
							id: serviceProvider1.id,
							name: 'SP1',
						},
					},
				],
			},
		]);
	});
});
