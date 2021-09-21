import * as request from 'request';
import { OneOffTimeslotResponse } from '../../src/components/oneOffTimeslots/oneOffTimeslots.apicontract';
import { OrganisationAdminRequestEndpointSG } from '../utils/requestEndpointSG';

export const populateOneOffTimeslot = async ({
	serviceProviderId,
	startTime,
	endTime,
	capacity,
	labelIds,
	title,
	description,
}: {
	serviceProviderId: number;
	startTime?: Date;
	endTime?: Date;
	capacity?: number;
	labelIds?: string[];
	title?: string;
	description?: string;
}): Promise<[request.Response, OneOffTimeslotResponse]> => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).post(`/oneOffTimeslots`, {
		body: {
			startDateTime: startTime || new Date(new Date().getTime() +23  *60* 60 * 1000),
			endDateTime: endTime || new Date(new Date().getTime() + 24* 60* 60 * 1000),
			capacity: capacity || 1,
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
