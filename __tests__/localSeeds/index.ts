import { OrganisationAdminRequestEndpointSG } from '../utils/requestEndpointSG';
import { BOOKINSG_API_ENDPOINT, fetch } from '../utils/fetch';
const SERVICE_ID = '1';

const populateDBWithUsers = async () => {
	const org = await OrganisationAdminRequestEndpointSG.create({ serviceId: SERVICE_ID });
	const headers = { ...org.getHeader(), ['x-api-service']: SERVICE_ID };
	await fetch().postCSV('/users/service-providers/upsert/csv', './__tests__/seeds/serviceProviders.csv', headers);
};

const addScheduleForm = async () => {
	const org = await OrganisationAdminRequestEndpointSG.create({ serviceId: SERVICE_ID });
	const headers = { ...org.getHeader(), ['use-admin-auth-forwarder']: 'true' };
	await fetch().put(`${BOOKINSG_API_ENDPOINT}/organisations/${SERVICE_ID}/scheduleForm`, scheduleFrom, headers);
};

const main = async () => {
	await populateDBWithUsers();
	await addScheduleForm();
};

main();

const scheduleFrom = {
	slotsDurationInMin: 60,
	weekdaySchedules: [
		{
			weekday: 0,
			hasScheduleForm: true,
			openTime: '08:00',
			closeTime: '20:00',
			breaks: [{ startTime: '12:00', endTime: '13:00' }],
		},
		{
			weekday: 1,
			hasScheduleForm: true,
			openTime: '08:00',
			closeTime: '20:00',
			breaks: [{ startTime: '12:00', endTime: '13:00' }],
		},
		{
			weekday: 2,
			hasScheduleForm: true,
			openTime: '08:00',
			closeTime: '20:00',
			breaks: [{ startTime: '12:00', endTime: '13:00' }],
		},
		{
			weekday: 3,
			hasScheduleForm: true,
			openTime: '08:00',
			closeTime: '20:00',
			breaks: [{ startTime: '12:00', endTime: '13:00' }],
		},
		{
			weekday: 4,
			hasScheduleForm: true,
			openTime: '08:00',
			closeTime: '20:00',
			breaks: [{ startTime: '12:00', endTime: '13:00' }],
		},
		{
			weekday: 5,
			hasScheduleForm: true,
			openTime: '08:00',
			closeTime: '20:00',
			breaks: [{ startTime: '12:00', endTime: '13:00' }],
		},
		{
			weekday: 6,
			hasScheduleForm: true,
			openTime: '08:00',
			closeTime: '20:00',
			breaks: [{ startTime: '12:00', endTime: '13:00' }],
		},
	],
};
