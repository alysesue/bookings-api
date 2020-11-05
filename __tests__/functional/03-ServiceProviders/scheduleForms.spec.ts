import { AdminRequestEndpointSG } from '../../utils/requestEndpointSG';
import { PgClient } from '../../utils/pgClient';
import { populateService, populateServiceAndServiceProvider } from '../../Populate/basic';

describe('Tests endpoint and populate data', () => {
	const SP_NAME = 'sp';
	const pgClient = new PgClient();
	let serviceId: string;
	let serviceProviderId;

	beforeAll(async () => {
		await pgClient.cleanAllTables();
		const props = await populateServiceAndServiceProvider({});
		serviceId = props.serviceId;
		serviceProviderId = props.serviceProviderId;
	});

	afterAll(async () => {
		await pgClient.cleanAllTables();
		await pgClient.close();
	});

	it('Post scheduleForm', async () => {
		const scheduleForm = {
			name: SP_NAME,
			serviceProviderId: serviceProviderId!,
			slotsDurationInMin: 60,
			weekdaySchedules: [
				{
					weekday: 0,
					hasScheduleForm: false,
					openTime: '09:00',
					closeTime: '17:00',
					breaks: [],
				},
				{
					weekday: 1,
					hasScheduleForm: true,
					openTime: '09:00',
					closeTime: '17:00',
					breaks: [
						{
							startTime: '12:00',
							endTime: '13:00',
						},
					],
				},
				{
					weekday: 2,
					hasScheduleForm: true,
					openTime: '09:00',
					closeTime: '17:00',
					breaks: [
						{
							startTime: '12:00',
							endTime: '13:00',
						},
					],
				},
				{
					weekday: 3,
					hasScheduleForm: true,
					openTime: '09:00',
					closeTime: '17:00',
					breaks: [
						{
							startTime: '12:00',
							endTime: '13:00',
						},
					],
				},
				{
					weekday: 4,
					hasScheduleForm: true,
					openTime: '09:00',
					closeTime: '17:00',
					breaks: [
						{
							startTime: '12:00',
							endTime: '13:00',
						},
					],
				},
				{
					weekday: 5,
					hasScheduleForm: true,
					openTime: '09:00',
					closeTime: '17:00',
					breaks: [
						{
							startTime: '12:00',
							endTime: '13:00',
						},
					],
				},
				{
					weekday: 6,
					hasScheduleForm: false,
					openTime: '09:00',
					closeTime: '17:00',
					breaks: [],
				},
			],
		};
		const response = await AdminRequestEndpointSG.create({ serviceId: serviceId! }).post('/scheduleForms', {
			body: scheduleForm,
		});

		expect(response.statusCode).toEqual(201);
	});
});
