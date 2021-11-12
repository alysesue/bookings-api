import { Roles } from '../../utils/enums';
import * as request from 'request';
import {
	CitizenRequestEndpointSG,
	OrganisationAdminRequestEndpointSG,
	ServiceAdminRequestEndpointSG,
	ServiceProviderRequestEndpointSG,
} from '../../utils/requestEndpointSG';
import { OneOffTimeslotResponse } from '../../../src/components/oneOffTimeslots/oneOffTimeslots.apicontract';

export const populateOneOffTimeslot = async ({
	serviceProviderId,
	startTime,
	endTime,
	capacity,
	labelIds,
	title = 'title',
	description,
	role,
	requestDetails,
}: {
	serviceProviderId: number;
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

	const response = await endpoint.post(`/oneOffTimeslots`, {
		body: {
			startDateTime: startTime,
			endDateTime: endTime,
			capacity,
			serviceProviderId,
			title,
			description,
			labelIds,
		},
	});

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
	serviceProviderId: number;
	startTime: Date;
	endTime: Date;
	capacity: number;
	labelIds?: string[];
	title?: string;
	description?: string;
	idSigned: string;
}): Promise<[request.Response, OneOffTimeslotResponse]> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).put(`/oneOffTimeslots/${idSigned}`, {
		body: {
			startDateTime: startTime,
			endDateTime: endTime,
			capacity,
			serviceProviderId,
			title,
			description,
			labelIds,
		},
	});
	return [response, response.body.data];
};

export const deleteOneOffTimeslot = async (idSigned: string): Promise<any> => {
	return await OrganisationAdminRequestEndpointSG.create({}).delete(`/oneOffTimeslots/${idSigned}`);
};
