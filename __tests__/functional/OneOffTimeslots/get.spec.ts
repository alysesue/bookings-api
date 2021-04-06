import { PgClient } from '../../utils/pgClient';
import {
	CitizenRequestEndpointSG,
	OrganisationAdminRequestEndpointSG,
	ServiceAdminRequestEndpointSG,
	ServiceProviderRequestEndpointSG,
} from '../../utils/requestEndpointSG';
import { populateOneOffTimeslot, populateUserServiceProvider } from '../../populate/basic';
import { ServiceProviderResponseModel } from '../../../src/components/serviceProviders/serviceProviders.apicontract';
import { LabelRequestModel } from '../../../src/components/labels/label.apicontract';

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

	const labels: LabelRequestModel[] = [];
	const label = new LabelRequestModel();
	label.label = 'Chinese';
	labels.push(label);

	let serviceProvider1: ServiceProviderResponseModel;
	let serviceProvider2: ServiceProviderResponseModel;
	let serviceProvider3: ServiceProviderResponseModel;
	let serviceId1: string;
	let serviceId2: string;
	let serviceId3: string;

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

		await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: START_TIME_1,
			endTime: END_TIME_1,
			capacity: 1,
			labels,
		});
		await populateOneOffTimeslot({
			serviceProviderId: serviceProvider2.id,
			startTime: START_TIME_2,
			endTime: END_TIME_2,
			capacity: 2,
			labels,
		});
		await populateOneOffTimeslot({
			serviceProviderId: serviceProvider3.id,
			startTime: START_TIME_3,
			endTime: END_TIME_3,
			capacity: 3,
			labels,
		});

		done();
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

		expect(service2TimeslotsResponse.statusCode).toEqual(200);
		expect(service2TimeslotsResponse.body.data[0].startTime).toEqual(START_TIME_2.toISOString());
		expect(service2TimeslotsResponse.body.data[0].endTime).toEqual(END_TIME_2.toISOString());
		expect(service2TimeslotsResponse.body.data[0].timeslotServiceProviders.length).toBe(1);
		expect(service2TimeslotsResponse.body.data[0].timeslotServiceProviders[0].capacity).toBe(2);

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
			{ availabilityCount: 1, startTime: '2021-03-05T01:00:00.000Z', endTime: '2021-03-05T02:00:00.000Z' },
		]);

		expect(availability2Response.statusCode).toEqual(200);
		expect(availability2Response.body.data).toEqual([
			{ availabilityCount: 2, startTime: '2021-03-06T06:00:00.000Z', endTime: '2021-03-06T07:00:00.000Z' },
		]);

		expect(availability3Response.statusCode).toEqual(200);
		expect(availability3Response.body.data).toEqual([
			{ availabilityCount: 3, startTime: '2021-03-07T07:00:00.000Z', endTime: '2021-03-07T08:00:00.000Z' },
		]);
	});
});
