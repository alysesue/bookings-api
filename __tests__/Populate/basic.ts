import { OrganisationAdminRequestEndpointSG } from '../utils/requestEndpointSG';
import { ServiceProviderResponseModel } from '../../src/components/serviceProviders/serviceProviders.apicontract';
import { ServiceResponse } from '../../src/components/services/service.apicontract';
import { TimeslotItemResponse } from '../../src/components/timeslotItems/timeslotItems.apicontract';

export const populateService = async ({
	organisation = 'localorg',
	nameService = 'admin',
}): Promise<ServiceResponse> => {
	const response = await OrganisationAdminRequestEndpointSG.create({ organisation, nameService }).post('/services', {
		body: { name: nameService },
	});
	return response.body.data;
};

/**
 * @deprecated Please use populateUserServiceProvider
 *
 */
export const populateServiceAndServiceProvider = async ({
	organisation = 'localorg',
	nameService = 'admin',
	serviceProviderName = 'sp',
}): Promise<{ service: ServiceResponse; serviceProvider: ServiceProviderResponseModel }> => {
	const service = await populateService({ organisation, nameService });
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
	const serviceProvider = response.body.data;
	return { service, serviceProvider };
};

export const populateUserServiceProvider = async ({
	organisation = 'localorg',
	nameService = 'admin',
	serviceProviderName = 'sp',
}): Promise<{ services: ServiceResponse; serviceProviders: ServiceProviderResponseModel }> => {
	await OrganisationAdminRequestEndpointSG.create({ organisation }).post('/users/service-providers/upsert', {
		body: [
			{
				name: serviceProviderName,
				phoneNumber: '+33 3333 3333',
				email: 'ad@ad.com',
				agencyUserId: '001',
				uinfin: 'S6752764Z',
				serviceName: nameService,
			},
		],
	});
	const response = await OrganisationAdminRequestEndpointSG.create({}).get('/service-providers');
	const responseService = await OrganisationAdminRequestEndpointSG.create({}).get('/services');
	const serviceProviders = response.body.data;
	const services = responseService.body.data;
	return { services, serviceProviders };
};

export const populateOutOfSlotBooking = async ({
	startDateTime,
	endDateTime,
	serviceId,
	serviceProviderId,
	citizenUinFin,
	citizenName,
	citizenEmail,
}): Promise<string> => {
	const response = await OrganisationAdminRequestEndpointSG.create({ serviceId }).post('/bookings/admin', {
		body: {
			startDateTime,
			endDateTime,
			serviceProviderId,
			citizenUinFin,
			citizenName,
			citizenEmail,
		},
	});
	return response.body.data.id;
};

export const populateIndividualTimeslot = async ({
	serviceProviderId,
	weekDay,
	startTime,
	endTime,
	capacity,
}): Promise<TimeslotItemResponse> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).post(
		`/service-providers/${serviceProviderId}/timeslotSchedule/timeslots`,
		{
			body: {
				weekDay,
				startTime,
				endTime,
				capacity,
			},
		},
	);
	return response.body.data;
};
