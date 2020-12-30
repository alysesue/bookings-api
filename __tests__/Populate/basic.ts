import { OrganisationAdminRequestEndpointSG } from '../utils/requestEndpointSG';
import { ServiceProviderResponseModel } from '../../src/components/serviceProviders/serviceProviders.apicontract';
import { ServiceResponse } from '../../src/components/services/service.apicontract';
import { TimeslotItemResponse } from "../../src/components/timeslotItems/timeslotItems.apicontract";
import 'moment-timezone';

export const populateService = async ({
	organisation = 'localorg',
	nameService = 'admin',
}): Promise<ServiceResponse> => {
	const response = await OrganisationAdminRequestEndpointSG.create({ organisation, nameService }).post('/services', {
		body: { name: nameService },
	});
	return JSON.parse(response.body).data;
};

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
	const serviceProvider = JSON.parse(response.body).data;
	return { service, serviceProvider };
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
	return JSON.parse(response.body).data.id;
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
	return JSON.parse(response.body).data;
};

export const populateWeeklyTimesheet = async ({serviceProviderId, scheduleSlot, closeTime, openTime}) => {
	const response = await OrganisationAdminRequestEndpointSG.create({}).put(
		`/service-providers/${serviceProviderId}/scheduleForm`,
		{
			body: {
                slotsDurationInMin: scheduleSlot,
				weekdaySchedules: [{
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
					}]
			}
		}
	);

    return JSON.parse(response.body).data
}
