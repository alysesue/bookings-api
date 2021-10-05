import { ServiceResponseV1 } from '../../../src/components/services/service.apicontract';
import { ServiceProviderResponseModelV1 } from '../../../src/components/serviceProviders/serviceProviders.apicontract';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { MolServiceAdminUserContract } from '../../../src/components/users/molUsers/molUsers.apicontract';
import { HEADERS } from '../fetch';
import { getServiceProviders } from './serviceProviders';
import { getServices } from './services';

export const populateUserServiceProvider = async (
	user: Partial<MolServiceAdminUserContract>,
	headers?: HEADERS,
): Promise<{ services: ServiceResponseV1[]; serviceProviders: ServiceProviderResponseModelV1[] }> => {
	const phoneNumber = '+6580000000';
	const serviceName = 'admin';
	const name = 'sp';
	await OrganisationAdminRequestEndpointSG.create({ organisation: headers?.organisation }).post(
		'/users/service-providers/upsert',
		{
			body: [
				{
					name,
					phoneNumber,
					serviceName: user.serviceNames[0] || serviceName,
					...user,
				},
			],
		},
	);
	const serviceProviders = await getServiceProviders();
	const services = await getServices();
	return { services, serviceProviders };
};
