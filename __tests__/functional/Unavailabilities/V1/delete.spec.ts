import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import { populateServiceWithMultipleServiceProviders } from '../../../populate/basicV1';
import { PgClient } from '../../../utils/pgClient';
import { ServiceProviderResponseModelV1 } from '../../../../src/components/serviceProviders/serviceProviders.apicontract';

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

	const postUnavailabilities = async () => {
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

	beforeEach(async (done) => {
		await pgClient.cleanAllTables();

		const result = await populateServiceWithMultipleServiceProviders({
			nameService: NAME_SERVICE_1,
			serviceProviderNames: [{ name: SERVICE_PROVIDER_NAME_1 }, { name: SERVICE_PROVIDER_NAME_2 }],
		});

		serviceProvider1 = result.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1);
		serviceProvider2 = result.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_2);

		serviceId = result.service.id;

		done();
	});

	afterAll(async (done) => {
		await pgClient.cleanAllTables();
		await pgClient.close();
		done();
	});

	it('Should delete unavailability by id', async () => {
		const postResponse = await postUnavailabilities();
		expect(postResponse.statusCode).toEqual(201);

		const unavailabilityId = postResponse.body.data.id;
		const endpoint = await OrganisationAdminRequestEndpointSG.create({ serviceId });
		const deleteResponse = await endpoint.delete(`/unavailabilities/${unavailabilityId}`);
		expect(deleteResponse.statusCode).toEqual(204);

		const getResponse = await endpoint.get('/unavailabilities', {
			params: { fromDate: new Date(), toDate: new Date() },
		});
		expect(getResponse.statusCode).toEqual(200);
		expect(getResponse.body.data.length).toEqual(0);
	});
});
