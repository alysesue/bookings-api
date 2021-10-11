import { ServiceRequestV1, ServiceResponseV1 } from '../../../src/components/services/service.apicontract';
import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { HEADERS } from '../fetch';
import { ServiceNotificationTemplateResponse } from '../../../src/components/serviceNotificationTemplate/serviceNotificationTemplate.apicontract';

export const postService = async (serviceRequest: ServiceRequestV1, headers?: HEADERS): Promise<ServiceResponseV1> => {
	const response = await OrganisationAdminRequestEndpointSG.create({
		organisation: headers?.organisation,
		nameService: serviceRequest.name,
	}).post('/services', {
		body: { name: 'admin', labels: [], ...serviceRequest },
	});
	return response.body.data;
};

export const putService = async (
	serviceId: string,
	serviceRequest: ServiceRequestV1,
	headers?: HEADERS,
): Promise<ServiceResponseV1> => {
	const response = await OrganisationAdminRequestEndpointSG.create({
		organisation: headers?.organisation,
		nameService: serviceRequest.name,
	}).put(`/services/${serviceId}`, {
		body: { name: 'admin', labels: [], ...serviceRequest },
	});
	return response.body.data;
};

export const getServices = async (): Promise<ServiceResponseV1[]> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).get('/services');
	const services = response.body.data;
	return services;
};

export const putServiceLabel = async (
	id: string,
	labels: string[],
	serviceRequest: ServiceRequestV1,
): Promise<ServiceResponseV1> => {
	const labelsMap = labels.map((label) => ({ label }));
	return putService(id, { ...serviceRequest, labels: labelsMap });
};

export const postServiceWithFields = async (
	serviceRequest: ServiceRequestV1,
	headers?: HEADERS,
): Promise<ServiceResponseV1> => {
	return postService(serviceRequest, headers);
};

export const populateServiceWithAdditionalSettings = async (
	serviceRequest: ServiceRequestV1,
	headers?: HEADERS,
): Promise<ServiceResponseV1> => {
	return postService(serviceRequest, headers);
};

export const populateServiceWithVC = async (
	serviceRequest: ServiceRequestV1,
	headers?: HEADERS,
): Promise<ServiceResponseV1> => {
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
	);
	return response.body.data;
};
