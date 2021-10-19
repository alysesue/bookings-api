import { OrganisationAdminRequestEndpointSG } from '../../utils/requestEndpointSG';

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

