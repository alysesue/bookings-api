import { ServiceRequestV2, ServiceResponseV2 } from '../../../src/components/services/service.apicontract';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { HEADERS } from '../fetch';
import { ServiceNotificationTemplateResponse } from '../../../src/components/serviceNotificationTemplate/serviceNotificationTemplate.apicontract';

export const postService = async (serviceRequest: ServiceRequestV2, headers?: HEADERS): Promise<ServiceResponseV2> => {
	const response = await OrganisationAdminRequestEndpointSG.create({
		organisation: headers?.organisation,
		nameService: serviceRequest.name,
	}).post(
		'/services',
		{
			body: { name: 'admin', labels: [], ...serviceRequest },
		},
		'V2',
	);
	return response.body.data;
};

export const putService = async (
	serviceId: string,
	serviceRequest: ServiceRequestV2,
	headers?: HEADERS,
): Promise<ServiceResponseV2> => {
	const response = await OrganisationAdminRequestEndpointSG.create({
		organisation: headers?.organisation,
		nameService: serviceRequest.name,
	}).put(
		`/services/${serviceId}`,
		{
			body: { name: 'admin', labels: [], ...serviceRequest },
		},
		'V2',
	);
	return response.body.data;
};

export const getServices = async (): Promise<ServiceResponseV2[]> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).get('/services', undefined, 'V2');
	const services = response.body.data;
	return services;
};

export const putServiceLabel = async (
	id: string,
	labels: string[],
	serviceRequest: ServiceRequestV2,
): Promise<ServiceResponseV2> => {
	const labelsMap = labels.map((label) => ({ label }));
	return putService(id, { ...serviceRequest, labels: labelsMap });
};

export const postServiceWithFields = async (
	serviceRequest: ServiceRequestV2,
	headers?: HEADERS,
): Promise<ServiceResponseV2> => {
	return postService(serviceRequest, headers);
};

export const populateServiceWithAdditionalSettings = async (
	serviceRequest: ServiceRequestV2,
	headers?: HEADERS,
): Promise<ServiceResponseV2> => {
	return postService(serviceRequest, headers);
};

export const populateServiceWithVC = async (
	serviceRequest: ServiceRequestV2,
	headers?: HEADERS,
): Promise<ServiceResponseV2> => {
	const videoConferenceUrl = 'http://www.zoom.us/1234567';
	return postService({ videoConferenceUrl, ...serviceRequest }, headers);
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
		'V2',
	);
	return response.body.data;
};
