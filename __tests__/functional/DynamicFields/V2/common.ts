import { OrganisationAdminRequestEndpointSG } from '../../../utils/requestEndpointSG';
import * as request from 'request';
import { DynamicFieldModel } from '../../../../src/components/dynamicFields/dynamicFields.apicontract';

export const postTextDynamicField = async (
	{ serviceId }: { serviceId: string },
	isMandatory: boolean,
): Promise<request.Response> => {
	const body = {
		name: 'notes',
		type: 'TextField',
		textField: { charLimit: 15 },
		isMandatory: isMandatory,
	};

	const endpoint = OrganisationAdminRequestEndpointSG.create({
		serviceId: `${serviceId}`,
	});

	return await endpoint.post('/dynamicFields', { body }, 'V2');
};

export const postSelectListDynamicField = async (
	{ serviceId }: { serviceId: string },
	isMandatory: boolean,
): Promise<request.Response> => {
	const body = {
		name: 'options',
		type: 'SelectList',
		isMandatory: isMandatory,
		selectList: {
			options: [
				{ key: 1, value: 'A' },
				{ key: 2, value: 'B' },
			],
		},
	};

	const endpoint = OrganisationAdminRequestEndpointSG.create({
		serviceId: `${serviceId}`,
	});

	return await endpoint.post('/dynamicFields', { body }, 'V2');
};

export const putDynamicField = async ({
	serviceId,
	idSigned,
	params,
}: {
	serviceId: string;
	idSigned: string;
	params: { body: any };
}): Promise<request.Response> => {
	const endpoint = OrganisationAdminRequestEndpointSG.create({
		serviceId: `${serviceId}`,
	});

	return await endpoint.put(`/dynamicFields/${idSigned}`, params, 'V2');
};

export const deleteDynamicField = async ({
	serviceId,
	idSigned,
}: {
	serviceId: string;
	idSigned: string;
}): Promise<request.Response> => {
	const endpoint = OrganisationAdminRequestEndpointSG.create({
		serviceId: `${serviceId}`,
	});

	return await endpoint.delete(`/dynamicFields/${idSigned}`, {}, 'V2');
};

export const getDynamicFields = async ({ serviceId }: { serviceId: string }): Promise<DynamicFieldModel[]> => {
	const endpoint = OrganisationAdminRequestEndpointSG.create({
		serviceId: `${serviceId}`,
	});

	const response = await endpoint.get('/dynamicFields', {}, 'V2');
	return response.body?.data as DynamicFieldModel[];
};
