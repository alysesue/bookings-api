import { ServiceProviderResponseModelV1 } from '../../src/components/serviceProviders/serviceProviders.apicontract';
import { OrganisationAdminRequestEndpointSG } from '../utils/requestEndpointSG';
import { ServiceResponseV1 } from '../../src/components/services/service.apicontract';
import { populateService } from './service';

export const getServiceProviders = async (): Promise<ServiceProviderResponseModelV1[]> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).get('/service-providers');
	const serviceProvider = response.body.data;
	return serviceProvider;
};

export const populateServiceAndServiceProvider = async ({
	organisation = 'localorg',
	nameService = 'admin',
	serviceProviderName = 'sp',
	labels = [],
	categories = [],
}): Promise<{ service: ServiceResponseV1; serviceProvider: ServiceProviderResponseModelV1 }> => {
	const service = await populateService({ organisation, nameService, labels, categories });
	await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id.toString() }).post('/service-providers', {
		body: {
			serviceProviders: [
				{
					name: serviceProviderName,
				},
			],
		},
	});
	const response = await OrganisationAdminRequestEndpointSG.create({}).get('/service-providers');
	const serviceProvider = response.body.data[0];
	return { service, serviceProvider };
};
