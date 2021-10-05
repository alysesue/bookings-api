import {
	ServiceProviderResponseModelV1,
	ServiceProviderSummaryModelBase,
} from '../../../src/components/serviceProviders/serviceProviders.apicontract';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { ServiceResponseV1 } from '../../../src/components/services/service.apicontract';
import { postService } from './services';
import {
	TimeslotItemRequest,
	TimeslotItemResponseV1,
} from '../../../src/components/timeslotItems/timeslotItems.apicontract';

export const getServiceProviders = async (): Promise<ServiceProviderResponseModelV1[]> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).get('/service-providers');
	const serviceProvider = response.body.data;
	return serviceProvider;
};

// export const populateServiceAndServiceProvider = async ({
// 	organisation = 'localorg',
// 	nameService = 'admin',
// 	serviceProviderName = 'sp',
// 	labels = [],
// 	categories = [],
// }): Promise<{ service: ServiceResponseV1; serviceProvider: ServiceProviderResponseModelV1 }> => {
// 	const service = await populateService({ organisation, nameService, labels, categories });
// 	await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id.toString() }).post('/service-providers', {
// 		body: {
// 			serviceProviders: [
// 				{
// 					name: serviceProviderName,
// 				},
// 			],
// 		},
// 	});
// 	const response = await OrganisationAdminRequestEndpointSG.create({}).get('/service-providers');
// 	const serviceProvider = response.body.data[0];
// 	return { service, serviceProvider };
// };

export const setServiceProviderAutoAssigned = async ({
	nameService = 'admin',
	serviceId,
	isSpAutoAssigned = false,
}): Promise<ServiceResponseV1> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceId}`, {
		body: { name: nameService, isSpAutoAssigned },
	});
	return response.body.data;
};

export const populateServiceWithMultipleServiceProviders = async ({
	organisation = 'localorg',
	nameService = 'admin',
	serviceProviderNames = [{ name: 'sp1' }, { name: 'sp2' }],
	labels = [],
}: {
	organisation?: string;
	nameService?: string;
	serviceProviderNames?: ServiceProviderSummaryModelBase[];
	labels?: [];
}): Promise<{ service: ServiceResponseV1; serviceProviders: ServiceProviderResponseModelV1[] }> => {
	const service = await postService({ name: nameService, labels }, { organisation });
	await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id.toString() }).post('/service-providers', {
		body: {
			serviceProviders: serviceProviderNames,
		},
	});
	const response = await OrganisationAdminRequestEndpointSG.create({}).get('/service-providers');
	const serviceProviders = response.body.data;
	return { service, serviceProviders };
};

export const populateServiceAndServiceProvider = async ({
	organisation = 'localorg',
	nameService = 'admin',
	serviceProviderName = 'sp',
	labels = [],
	categories = [],
}): Promise<{ service: ServiceResponseV1; serviceProvider: ServiceProviderResponseModelV1 }> => {
	const service = await postService({ name: nameService, labels, categories }, { organisation });
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

export const postServiceProvider = async (serviceId: string): Promise<void> => {
	await OrganisationAdminRequestEndpointSG.create({
		serviceId,
	}).post('/service-providers', {
		body: {
			serviceProviders: [
				{
					name: 'sp',
					email: `sp@govtech.com`,
					phone: '+6580000000',
				},
			],
		},
	});
};

export const populateIndividualTimeslot = async (
	serviceProviderId,
	{ weekDay, startTime, endTime, capacity }: TimeslotItemRequest,
): Promise<TimeslotItemResponseV1> => {
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

export const populateWeeklyTimesheet = async ({ serviceProviderId, scheduleSlot, closeTime, openTime }) => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).put(
		`/service-providers/${serviceProviderId}/scheduleForm`,
		{
			body: {
				slotsDurationInMin: scheduleSlot,
				weekdaySchedules: [
					{
						weekday: 0,
						hasScheduleForm: true,
						breaks: [],
						closeTime,
						openTime,
					},
					{
						weekday: 1,
						hasScheduleForm: true,
						breaks: [],
						closeTime,
						openTime,
					},
					{
						weekday: 2,
						hasScheduleForm: true,
						breaks: [],
						closeTime,
						openTime,
					},
					{
						weekday: 3,
						hasScheduleForm: true,
						breaks: [],
						closeTime,
						openTime,
					},
					{
						weekday: 4,
						hasScheduleForm: true,
						breaks: [],
						closeTime,
						openTime,
					},
					{
						weekday: 5,
						hasScheduleForm: true,
						breaks: [],
						closeTime,
						openTime,
					},
					{
						weekday: 6,
						hasScheduleForm: true,
						breaks: [],
						closeTime,
						openTime,
					},
				],
			},
		},
	);

	return response.body.data;
};
