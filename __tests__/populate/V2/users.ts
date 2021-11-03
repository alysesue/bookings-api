import { MolServiceAdminUserContract } from '../../../src/components/users/molUsers/molUsers.apicontract';
import { HEADERS } from '../fetch';
import { ServiceResponseV2 } from '../../../src/components/services/service.apicontract';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { getServices } from './services';
import { ServiceProviderResponseModelV2 } from '../../../src/components/serviceProviders/serviceProviders.apicontract';
import { getServiceProviders } from './servieProviders';
import { UserProfileResponseV2 } from '../../../src/components/users/users.apicontract';

export const populateUserServiceProvider = async (
	user: Partial<MolServiceAdminUserContract>,
	headers?: HEADERS,
): Promise<{ services: ServiceResponseV2[]; serviceProviders: ServiceProviderResponseModelV2[] }> => {
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
					serviceName: user?.serviceNames[0] || serviceName,
					...user,
				},
			],
		},
	);
	const serviceProviders = await getServiceProviders();
	const services = await getServices();
	return { services, serviceProviders };
};

export const getMe = async (): Promise<UserProfileResponseV2> => {
	const me = await OrganisationAdminRequestEndpointSG.create({}).get('users/me', undefined, 'V2');
	return me.body.data;
};
