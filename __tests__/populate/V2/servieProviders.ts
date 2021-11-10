import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import {
	ServiceProviderModel,
	ServiceProviderResponseModelV2,
	ServiceProviderSummaryModelBase,
} from '../../../src/components/serviceProviders/serviceProviders.apicontract';
import { ServiceResponseV2 } from '../../../src/components/services/service.apicontract';
import { postService } from './services';
import {
	TimeslotItemRequest,
	TimeslotItemResponseV2,
} from '../../../src/components/timeslotItems/timeslotItems.apicontract';

export const getServiceProviders = async (): Promise<ServiceProviderResponseModelV2[]> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).get('/service-providers', undefined, 'V2');
	const serviceProvider = response.body.data;
	return serviceProvider;
};

export const setServiceProviderAutoAssigned = async ({
	nameService = 'admin',
	serviceId,
	isSpAutoAssigned = false,
}): Promise<ServiceResponseV2> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).put(
		`/services/${serviceId}`,
		{
			body: { name: nameService, isSpAutoAssigned },
		},
		'V2',
	);
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
}): Promise<{ service: ServiceResponseV2; serviceProviders: ServiceProviderResponseModelV2[] }> => {
	const service = await postService({ name: nameService, labels }, { organisation });
	await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id.toString() }).post(
		'/service-providers',
		{
			body: {
				serviceProviders: serviceProviderNames,
			},
		},
		'V2',
	);
	const serviceProviders = await getServiceProviders();
	return { service, serviceProviders };
};

export const populateServiceAndServiceProvider = async ({
	organisation = 'localorg',
	nameService = 'admin',
	serviceProviderName = 'sp',
	labels = [],
	categories = [],
}): Promise<{ service: ServiceResponseV2; serviceProvider: ServiceProviderResponseModelV2 }> => {
	const service = await postService({ name: nameService, labels, categories }, { organisation });
	await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id.toString() }).post(
		'/service-providers',
		{
			body: {
				serviceProviders: [
					{
						name: serviceProviderName,
					},
				],
			},
		},
		'V2',
	);
	const response = await OrganisationAdminRequestEndpointSG.create({}).get('/service-providers', undefined, 'V2');
	const serviceProvider = response.body.data;
	return { service, serviceProvider };
};

export const postServiceProvider = async (serviceId: string): Promise<void> => {
	await OrganisationAdminRequestEndpointSG.create({
		serviceId,
	}).post(
		'/service-providers',
		{
			body: {
				serviceProviders: [
					{
						name: 'sp',
						email: `sp@govtech.com`,
						phone: '+6580000000',
					},
				],
			},
		},
		'V2',
	);
};

export const putServiceProvider = async (serviceProviderId: string, sp: ServiceProviderModel): Promise<ServiceProviderResponseModelV2> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).put(
		`/service-providers/${serviceProviderId}`,
		{
			body: {
				...sp,
			},
		},
		'V2',
	);
	return response.body.data;
};

export const populateIndividualTimeslot = async (
	serviceProviderId,
	{ weekDay, startTime, endTime, capacity }: TimeslotItemRequest,
): Promise<TimeslotItemResponseV2> => {
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
		'V2',
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
		'V2',
	);

	return response.body.data;
};
