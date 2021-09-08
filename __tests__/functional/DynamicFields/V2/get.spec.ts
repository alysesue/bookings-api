import { CitizenRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { populateUserServiceProvider, populateWeeklyTimesheet } from '../../../populate/basicV2';
import { PgClient } from '../../../utils/pgClient';
import { ServiceProviderResponseModelV2 } from '../../../../src/components/serviceProviders/serviceProviders.apicontract';
import { IdHasherForFunctional } from '../../../utils/idHashingUtil';

describe('Dynamic Fields functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	const START_TIME_1 = '09:00';
	const END_TIME_1 = '12:00';
	const NAME_SERVICE_2 = 'service2';
	const SERVICE_PROVIDER_NAME_2 = 'SP2';
	const START_TIME_2 = '09:00';
	const END_TIME_2 = '12:00';

	const citizenUinFin = 'S7429377H';

	let serviceProvider1: ServiceProviderResponseModelV2;
	let serviceProvider2: ServiceProviderResponseModelV2;
	let serviceId1;
	let serviceId2;

	const options = [
		{
			key: 1,
			value: 'option A',
		},
		{
			key: 2,
			value: 'option B',
		},
	];

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();

		const result = await populateUserServiceProvider({
			nameService: NAME_SERVICE_1,
			serviceProviderName: SERVICE_PROVIDER_NAME_1,
			agencyUserId: 'A001',
		});
		const result2 = await populateUserServiceProvider({
			nameService: NAME_SERVICE_2,
			serviceProviderName: SERVICE_PROVIDER_NAME_2,
			agencyUserId: 'A002',
		});
		serviceProvider1 = result.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1);
		serviceProvider2 = result2.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_2);

		serviceId1 = result.services.find((item) => item.name === NAME_SERVICE_1).id;
		serviceId2 = result2.services.find((item) => item.name === NAME_SERVICE_2).id;

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

		const idHasher = new IdHasherForFunctional();
		const serviceId = await idHasher.convertHashToId(serviceId1);
		await pgClient.mapDynamicFields({
			type: 'SelectListDynamicField',
			serviceId: serviceId,
			name: 'Select an option',
			options: JSON.stringify(options),
		});

		done();
	});

	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	it('Should return dynamic fields created ', async () => {
		const endpoint = await CitizenRequestEndpointSG.create({
			citizenUinFin,
			serviceId: serviceId1,
		});
		const response = await endpoint.get('/dynamicFields', {}, 'V2');

		console.log(response.body);

		const resultData = response.body.data[0];
		expect(resultData.name).toEqual('Select an option');
		expect(resultData.type).toEqual('SelectList');
		expect(resultData.selectList.options).toEqual(options);
	});

	it('Should receive empty array if service does not have dynamic fields ', async () => {
		const endpoint = await CitizenRequestEndpointSG.create({ citizenUinFin, serviceId: serviceId2 });
		const response = await endpoint.get('/dynamicFields', {}, 'V2');

		expect(response.body.data).toEqual([]);
	});
});
