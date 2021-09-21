import { version } from 'process';
import {
	PartialAdditionalSettings,
	ServiceResponseV1,
	ServiceResponseV2,
} from '../../src/components/services/service.apicontract';
import { OrganisationAdminRequestEndpointSG } from '../utils/requestEndpointSG';

export const populateServiceLabel = async ({
	serviceId,
	serviceName,
	labels,
}: {
	serviceId: any;
	serviceName: any;
	labels: string[];
}): Promise<ServiceResponseV1> => {
	const labelsMap = labels.map((label) => ({ label }));
	const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/services/${serviceId}`, {
		body: { name: serviceName, labels: labelsMap },
	});
	return response.body.data;
};

export const populateService = async ({
	organisation = 'e2e',
	nameService = 'admin',
	labels = [],
	categories = [],
	requestOptions = undefined,
}): Promise<ServiceResponseV1> => {
	const labelsMap = labels.map((label) => ({ label }));
	const response = await OrganisationAdminRequestEndpointSG.create(
		{ organisation, nameService },
		requestOptions,
	).post(`/services`, {
		body: { name: nameService, labels: labelsMap, categories },
	});
	return response.body.data;
};

export const populateServiceV2 = async ({
	organisation = 'e2e',
	nameService = 'admin',
	labels = [],
	categories = [],
}): Promise<ServiceResponseV2> => {
	const labelsMap = labels.map((label) => ({ label }));
	const response = await OrganisationAdminRequestEndpointSG.create({ organisation, nameService }).post(`/services`, {
		body: { name: nameService, labels: labelsMap, categories },
	});
	return response.body.data;
};

export const populateServiceWithFields = async ({
	organisation = 'e2e',
	nameService = 'admin',
	videoConferenceUrl,
	additionalSettings,
}: {
	organisation?: string;
	nameService?: string;
	videoConferenceUrl?: string;
	additionalSettings?: PartialAdditionalSettings;
}): Promise<ServiceResponseV1> => {
	const response = await OrganisationAdminRequestEndpointSG.create({ organisation, nameService }).post('/services', {
		body: { name: nameService, videoConferenceUrl, additionalSettings },
	});
	return response.body.data;
};
