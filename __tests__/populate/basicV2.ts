import {
	CitizenRequestEndpointSG,
	OrganisationAdminRequestEndpointSG,
	ServiceAdminRequestEndpointSG,
	ServiceProviderRequestEndpointSG,
} from '../utils/requestEndpointSG';
import { OneOffTimeslotResponse } from '../../src/components/oneOffTimeslots/oneOffTimeslots.apicontract';
import * as request from 'request';
import { ServiceNotificationTemplateResponse } from '../../src/components/serviceNotificationTemplate/serviceNotificationTemplate.apicontract';
import { Roles } from '../utils/enums';
import { PartialAdditionalSettings, ServiceResponseV2 } from '../../src/components/services/service.apicontract';
import {
	ServiceProviderResponseModelV2,
	ServiceProviderSummaryModelBase,
} from '../../src/components/serviceProviders/serviceProviders.apicontract';
import { TimeslotItemResponseV2 } from '../../src/components/timeslotItems/timeslotItems.apicontract';

export const populateServiceLabel = async ({
	serviceId,
	serviceName,
	labels,
}: {
	serviceId: any;
	serviceName: any;
	labels: string[];
}): Promise<ServiceResponseV2> => {
	const labelsMap = labels.map((label) => ({ label }));
	const response = await OrganisationAdminRequestEndpointSG.create({}).put(
		`/services/${serviceId}`,
		{
			body: { name: serviceName, labels: labelsMap },
		},
		'V2',
	);
	return response.body.data;
};

export const populateService = async ({
	organisation = 'localorg',
	nameService = 'admin',
	labels = [],
}): Promise<ServiceResponseV2> => {
	const response = await OrganisationAdminRequestEndpointSG.create({ organisation, nameService }).post(
		'/services',
		{
			body: { name: nameService, labels },
		},
		'V2',
	);
	return response.body.data;
};

export const populateServiceWithFields = async ({
	organisation = 'localorg',
	nameService = 'admin',
	videoConferenceUrl,
	additionalSettings,
}: {
	organisation?: string;
	nameService?: string;
	videoConferenceUrl?: string;
	additionalSettings?: PartialAdditionalSettings;
}): Promise<ServiceResponseV2> => {
	const response = await OrganisationAdminRequestEndpointSG.create({ organisation, nameService }).post(
		'/services',
		{
			body: { name: nameService, videoConferenceUrl, additionalSettings },
		},
		'V2',
	);
	return response.body.data;
};

export const populateServiceWithAdditionalSettings = async ({
	organisation = 'localorg',
	nameService = 'admin',
	additionalSettings = {
		allowAnonymousBookings: false,
		isOnHold: false,
		isStandAlone: false,
		sendNotifications: true,
		sendNotificationsToServiceProviders: true,
		sendSMSNotifications: false,
	},
}): Promise<ServiceResponseV2> => {
	const response = await OrganisationAdminRequestEndpointSG.create({ organisation, nameService }).post(
		'/services',
		{
			body: { name: nameService, additionalSettings },
		},
		'V2',
	);
	return response.body.data;
};

export const populateServiceWithVC = async ({
	organisation = 'localorg',
	nameService = 'admin',
	videoConferenceUrl = 'http://www.zoom.us/1234567',
}): Promise<ServiceResponseV2> => {
	const response = await OrganisationAdminRequestEndpointSG.create({ organisation, nameService }).post(
		'/services',
		{
			body: { name: nameService, videoConferenceUrl },
		},
		'V2',
	);
	return response.body.data;
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
	const service = await populateService({ organisation, nameService, labels });
	await OrganisationAdminRequestEndpointSG.create({ serviceId: service.id }).post(
		'/service-providers',
		{
			body: {
				serviceProviders: serviceProviderNames,
			},
		},
		'V2',
	);
	const response = await OrganisationAdminRequestEndpointSG.create({}).get('/service-providers', {}, 'V2');
	const serviceProviders = response.body.data;
	return { service, serviceProviders };
};

export const populateServiceAndServiceProvider = async ({
	organisation = 'localorg',
	nameService = 'admin',
	serviceProviderName = 'sp',
	labels = [],
}): Promise<{ service: ServiceResponseV2; serviceProvider: ServiceProviderResponseModelV2 }> => {
	const service = await populateService({ organisation, nameService, labels });
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
	const response = await OrganisationAdminRequestEndpointSG.create({}).get('/service-providers', {}, 'V2');
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
}): Promise<{ services: ServiceResponseV2[]; serviceProviders: ServiceProviderResponseModelV2[] }> => {
	await OrganisationAdminRequestEndpointSG.create({ organisation }).post(
		'/users/service-providers/upsert',
		{
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
		},
		'V1',
	);
	const response = await OrganisationAdminRequestEndpointSG.create({}).get('/service-providers', {}, 'V2');
	const responseService = await OrganisationAdminRequestEndpointSG.create({}).get('/services', {}, 'V2');
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
	const response = await OrganisationAdminRequestEndpointSG.create({ serviceId }).post(
		'/bookings/admin',
		{
			body: {
				startDateTime,
				endDateTime,
				serviceProviderId,
				citizenUinFin,
				citizenName,
				citizenEmail,
			},
		},
		'V2',
	);
	return response.body.data.id;
};

export const populateIndividualTimeslot = async ({
	serviceProviderId,
	weekDay,
	startTime,
	endTime,
	capacity,
}): Promise<TimeslotItemResponseV2> => {
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

export const populateOneOffTimeslot = async ({
	serviceProviderId,
	startTime,
	endTime,
	capacity,
	labelIds,
	title,
	description,
	role,
	requestDetails,
}: {
	serviceProviderId: string;
	startTime: Date;
	endTime: Date;
	capacity: number;
	labelIds?: string[];
	title?: string;
	description?: string;
	role?: Roles;
	requestDetails?: {
		serviceId: string;
		nameService?: string;
		molAdminId?: string;
	};
}): Promise<[request.Response, OneOffTimeslotResponse]> => {
	let endpoint;
	switch (role) {
		case Roles.Citizen:
			endpoint = CitizenRequestEndpointSG.create({ ...requestDetails });
			break;
		case Roles.ServiceProvider:
			endpoint = ServiceProviderRequestEndpointSG.create({
				...requestDetails,
			});
			break;
		case Roles.ServiceAdmin:
			endpoint = ServiceAdminRequestEndpointSG.create({
				...requestDetails,
			});
			break;
		case Roles.OrganisationAdmin:
		default:
			endpoint = OrganisationAdminRequestEndpointSG.create({});
	}

	const response = await endpoint.post(
		`/oneOffTimeslots`,
		{
			body: {
				startDateTime: startTime,
				endDateTime: endTime,
				capacity,
				serviceProviderId,
				title,
				description,
				labelIds,
			},
		},
		'V2',
	);

	return [response, response.body.data];
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
	serviceProviderId: string;
	startTime: Date;
	endTime: Date;
	capacity: number;
	labelIds?: string[];
	title?: string;
	description?: string;
	idSigned: string;
}): Promise<[request.Response, OneOffTimeslotResponse]> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).put(
		`/oneOffTimeslots/${idSigned}`,
		{
			body: {
				startDateTime: startTime,
				endDateTime: endTime,
				capacity,
				serviceProviderId,
				title,
				description,
				labelIds,
			},
		},
		'V2',
	);
	return [response, response.body.data];
};

export const deleteOneOffTimeslot = async (idSigned: string): Promise<any> => {
	return await OrganisationAdminRequestEndpointSG.create({}).delete(`/oneOffTimeslots/${idSigned}`, {}, 'V2');
};

export const populateServiceNotificationTemplate = async ({
	serviceId,
	emailTemplateType,
	htmlTemplate,
}): Promise<ServiceNotificationTemplateResponse> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).post(
		`/services/${serviceId}/notificationTemplate/email`,
		{
			body: {
				emailTemplateType,
				htmlTemplate,
			},
		},
		'V1',
	);
	return response.body.data;
};
