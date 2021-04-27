import { OrganisationAdminRequestEndpointSG } from '../utils/requestEndpointSG';
import { ServiceProviderResponseModel } from '../../src/components/serviceProviders/serviceProviders.apicontract';
import { ServiceResponse } from '../../src/components/services/service.apicontract';
import { TimeslotItemResponse } from '../../src/components/timeslotItems/timeslotItems.apicontract';
import { OneOffTimeslotResponse } from '../../src/components/oneOffTimeslots/oneOffTimeslots.apicontract';

export const populateServiceLabel = async ({
	serviceId,
	serviceName,
	labels,
}: {
	serviceId: any;
	serviceName: any;
	labels: string[];
}): Promise<ServiceResponse> => {
	const labelsMap = labels.map((label) => ({ label }));
	const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceId}`, {
		body: { name: serviceName, labels: labelsMap },
	});
	return response.body.data;
};

export const populateService = async ({
	organisation = 'localorg',
	nameService = 'admin',
}): Promise<ServiceResponse> => {
	const response = await OrganisationAdminRequestEndpointSG.create({ organisation, nameService }).post('/services', {
		body: { name: nameService },
	});
	return response.body.data;
};

export const setServiceProviderAutoAssigned = async ({
	nameService = 'admin',
	serviceId,
	isSpAutoAssigned = false,
}): Promise<ServiceResponse> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceId}`, {
		body: { name: nameService, isSpAutoAssigned },
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
	uinfin,
	email,
	agencyUserId,
	organisation = 'localorg',
	nameService = 'admin',
	serviceProviderName = 'sp',
}: {
	organisation?: string;
	nameService?: string;
	serviceProviderName?: string;
	uinfin?: string;
	agencyUserId: string; // making this required, so we can identify the service provider user
	email?: string;
}): Promise<{ services: ServiceResponse[]; serviceProviders: ServiceProviderResponseModel[] }> => {
	await OrganisationAdminRequestEndpointSG.create({ organisation }).post('/users/service-providers/upsert', {
		body: [
			{
				name: serviceProviderName,
				phoneNumber: '+6580000000',
				uinfin,
				agencyUserId,
				email,
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

export const populateOneOffTimeslot = async ({
	serviceProviderId,
	startTime,
	endTime,
	capacity,
	labelIds,
	title,
	description,
	idSigned,
}: {
	serviceProviderId: number;
	startTime: Date;
	endTime: Date;
	capacity: number;
	labelIds?: string[];
	title?: string;
	description?: string;
	idSigned?: string;
}): Promise<OneOffTimeslotResponse> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).post(`/oneOffTimeslots`, {
		body: {
			startDateTime: startTime,
			endDateTime: endTime,
			capacity,
			serviceProviderId,
			title,
			description,
			labelIds,
			idSigned,
		},
	});
	return response.body.data;
};

export const updateOneOffTimeslot = async ({
	serviceProviderId,
	startTime,
	endTime,
	capacity,
	labelIds,
	title,
	description,
	idSigned,
}: {
	serviceProviderId: number;
	startTime: Date;
	endTime: Date;
	capacity: number;
	labelIds?: string[];
	title?: string;
	description?: string;
	idSigned: string;
}): Promise<OneOffTimeslotResponse> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/oneOffTimeslots/${idSigned}`, {
		body: {
			startDateTime: startTime,
			endDateTime: endTime,
			capacity,
			serviceProviderId,
			title,
			description,
			labelIds,
			idSigned,
		},
	});
	return response.body.data;
};
