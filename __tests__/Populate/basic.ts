import { AdminRequestEndpointSG } from '../utils/requestEndpointSG';

export const populateService = async ({ organisation = 'localorg', nameService = 'admin' }): Promise<string> => {
	const response = await AdminRequestEndpointSG.create({ organisation, nameService }).post('/services', {
		body: { name: nameService },
	});
	return JSON.parse(response.body).data.id;
};

export const populateServiceAndServiceProvider = async ({
	organisation = 'localorg',
	nameService = 'admin',
	serviceProviderName = 'sp',
}): Promise<{ serviceId: string; serviceProviderId: string }> => {
	const serviceId = await populateService({ organisation, nameService });
	await AdminRequestEndpointSG.create({ serviceId }).post('/service-providers', {
		body: {
			serviceProviders: [
				{
					name: serviceProviderName,
				},
			],
		},
	});
	const response = await AdminRequestEndpointSG.create({}).get('/service-providers');
	const serviceProviderId = JSON.parse(response.body).data[0].id;
	return { serviceId, serviceProviderId };
};
