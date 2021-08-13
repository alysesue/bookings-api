import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import * as request from 'request';
import { DynamicFieldModel } from '../../../src/components/dynamicFields/dynamicFields.apicontract';

export const postTextDynamicField = async ({ serviceId }: { serviceId: number }): Promise<request.Response> => {
	const body = {
		name: 'notes',
		type: 'TextField',
		textField: { charLimit: 15 },
		isMandatory: true,
	};

	const endpoint = OrganisationAdminRequestEndpointSG.create({
		serviceId: `${serviceId}`,
	});

	return await endpoint.post('/dynamicFields', { body });
};

export const postSelectListDynamicField = async ({ serviceId }: { serviceId: number }): Promise<request.Response> => {
	const body = {
		name: 'options',
		type: 'SelectList',
		isMandatory: true,
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

	return await endpoint.post('/dynamicFields', { body });
};

export const putDynamicField = async ({
	serviceId,
	idSigned,
	params,
}: {
	serviceId: number;
	idSigned: string;
	params: { body: any };
}): Promise<request.Response> => {
	const endpoint = OrganisationAdminRequestEndpointSG.create({
		serviceId: `${serviceId}`,
	});

	return await endpoint.put(`/dynamicFields/${idSigned}`, params);
};

export const deleteDynamicField = async ({
	serviceId,
	idSigned,
}: {
	serviceId: number;
	idSigned: string;
}): Promise<request.Response> => {
	const endpoint = OrganisationAdminRequestEndpointSG.create({
		serviceId: `${serviceId}`,
	});

	return await endpoint.delete(`/dynamicFields/${idSigned}`);
};

export const getDynamicFields = async ({ serviceId }: { serviceId: number }): Promise<DynamicFieldModel[]> => {
	const endpoint = OrganisationAdminRequestEndpointSG.create({
		serviceId: `${serviceId}`,
	});

	const response = await endpoint.get('/dynamicFields');
	return response.body?.data as DynamicFieldModel[];
};
