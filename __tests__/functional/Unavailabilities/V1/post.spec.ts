import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { PgClient } from '../../../utils/pgClient';
import { ServiceProviderResponseModelV1 } from '../../../../src/components/serviceProviders/serviceProviders.apicontract';
import { populateServiceWithMultipleServiceProviders } from '../../../populate/V1/serviceProviders';

describe('Un-availabilities Functional tests', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	const SERVICE_PROVIDER_NAME_2 = 'SP2';
	const startTime = new Date();
	const endTime = new Date();
	endTime.setHours(endTime.getHours() + 2);

	let serviceProvider1: ServiceProviderResponseModelV1;
	let serviceProvider2: ServiceProviderResponseModelV1;
	let serviceId;

	const postUnavailabilitiesForAllSPs = async () => {
		const body = {
			startTime,
			endTime,
			serviceProviderIds: [],
			allServiceProviders: true,
		};

		const endpoint = OrganisationAdminRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		});

		return await endpoint.post('/unavailabilities', { body });
	};

	const postUnavailabilitiesForOneSP = async () => {
		const body = {
			startTime,
			endTime,
			serviceProviderIds: [serviceProvider1.id],
			allServiceProviders: false,
		};

		const endpoint = OrganisationAdminRequestEndpointSG.create({
			serviceId: `${serviceId}`,
		});

		return await endpoint.post('/unavailabilities', { body });
	};

	beforeEach(async () => {
		await pgClient.cleanAllTables();

		const result = await populateServiceWithMultipleServiceProviders({
			nameService: NAME_SERVICE_1,
			serviceProviderNames: [{ name: SERVICE_PROVIDER_NAME_1 }, { name: SERVICE_PROVIDER_NAME_2 }],
		});

		serviceProvider1 = result.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1);
		serviceProvider2 = result.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_2);

		serviceId = result.service.id;
	});

	afterAll(async () => {
		await pgClient.cleanAllTables();
		await pgClient.close();
	});

	it('Should add unavailabilities to all service providers', async () => {
		const response = await postUnavailabilitiesForAllSPs();
		expect(response.statusCode).toEqual(201);
		expect(response.body.data.allServiceProviders).toEqual(true);
	});

	it('Should add unavailabilities to one service provider', async () => {
		const response = await postUnavailabilitiesForOneSP();
		expect(response.statusCode).toBe(201);
		expect(response.body.data.serviceProviders.length).toEqual(1);
		expect(response.body.data.allServiceProviders).toEqual(false);
	});
});
