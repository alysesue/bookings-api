import { PgClient } from '../../../utils/pgClient';
import { Roles } from '../../../utils/enums';
import { ServiceProviderResponseModelV2 } from '../../../../src/components/serviceProviders/serviceProviders.apicontract';
import { ServiceResponseV2 } from '../../../../src/components/services/service.apicontract';
import { populateUserServiceProvider } from '../../../populate/V2/users';
import { putServiceLabel } from '../../../populate/V2/services';
import { populateOneOffTimeslot, updateOneOffTimeslot } from '../../../populate/V2/oneOffTimeslots';

describe('One-off timeslots functional tests - post', () => {
	const pgClient = new PgClient();
	const NAME_SERVICE_1 = 'service1';
	const SERVICE_PROVIDER_NAME_1 = 'SP1';
	const START_TIME_1 = new Date('2021-03-05T01:00:00Z');
	const END_TIME_1 = new Date('2021-03-05T02:00:00Z');
	const START_TIME_2 = new Date('2021-03-05T03:00:00Z');
	const END_TIME_2 = new Date('2021-03-05T04:00:00Z');

	let serviceProvider1: ServiceProviderResponseModelV2;
	let service: ServiceResponseV2;

	afterAll(async () => {
		await pgClient.cleanAllTables();
		await pgClient.close();
	});

	beforeEach(async () => {
		await pgClient.cleanAllTables();

		const result1 = await populateUserServiceProvider({
			serviceNames: [NAME_SERVICE_1],
			name: SERVICE_PROVIDER_NAME_1,
			agencyUserId: 'A001',
		});

		serviceProvider1 = result1.serviceProviders.find((item) => item.name === SERVICE_PROVIDER_NAME_1);

		service = await putServiceLabel(serviceProvider1.serviceId.toString(), ['Chinese'], {
			name: NAME_SERVICE_1,
		});
	});

	describe('populating one off timeslots', () => {
		it('should add one off timeslots with labels (org admin)', async () => {
			const [, data] = await populateOneOffTimeslot({
				serviceProviderId: serviceProvider1.id,
				startTime: START_TIME_1,
				endTime: END_TIME_1,
				capacity: 1,
				labelIds: [service.labels[0].id],
			});

			expect(data.labels[0].id).toEqual(service.labels[0].id);
			expect(data.labels[0].label).toEqual(service.labels[0].label);
		});

		it('should add one off timeslots with labels (service admin)', async () => {
			const role = Roles.ServiceAdmin;
			const [, data] = await populateOneOffTimeslot({
				serviceProviderId: serviceProvider1.id,
				startTime: START_TIME_1,
				endTime: END_TIME_1,
				capacity: 1,
				labelIds: [service.labels[0].id],
				role,
				requestDetails: { nameService: NAME_SERVICE_1, serviceId: service.id.toString() },
			});

			expect(data.labels[0].id).toEqual(service.labels[0].id);
			expect(data.labels[0].label).toEqual(service.labels[0].label);
		});

		it('should not add one off timeslots with labels (citizen)', async () => {
			const role = Roles.Citizen;
			const [response] = await populateOneOffTimeslot({
				serviceProviderId: serviceProvider1.id,
				startTime: START_TIME_1,
				endTime: END_TIME_1,
				capacity: 1,
				labelIds: [service.labels[0].id],
				role,
				requestDetails: { serviceId: service.id.toString() },
			});
			expect(response.body.errorCode).toBe('SYS_INVALID_AUTHORIZATION');
			expect(response.body.errorMessage).toBe('Invalid authorization.');
		});
	});

	it('should add oneOffTimeslots', async () => {
		const [, service1TimeslotsResponse] = await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: START_TIME_1,
			endTime: END_TIME_1,
			capacity: 1,
		});
		const { idSigned, ...obj } = service1TimeslotsResponse;

		expect(idSigned).toBeDefined();
		expect(obj).toEqual({
			capacity: 1,
			startDateTime: '2021-03-05T01:00:00.000Z',
			endDateTime: '2021-03-05T02:00:00.000Z',
			labels: [],
			title: 'title',
		});
	});

	it('should add oneOffTimeslots with title/description', async () => {
		const [, service1TimeslotsResponse] = await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: START_TIME_1,
			endTime: END_TIME_1,
			capacity: 1,
			title: 'Title',
			description: 'Description',
		});
		const { idSigned, ...obj } = service1TimeslotsResponse;

		expect(idSigned).toBeDefined();
		expect(obj).toEqual({
			capacity: 1,
			startDateTime: '2021-03-05T01:00:00.000Z',
			endDateTime: '2021-03-05T02:00:00.000Z',
			labels: [],
			title: 'Title',
			description: 'Description',
		});
	});

	it('should return error when oneOffTimeslots incorrect', async () => {
		const [response] = await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: END_TIME_1,
			endTime: START_TIME_1,
			capacity: 1,
			title: 'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii',
			description: 'Description',
		});

		expect(response.body.data).toEqual([
			{ code: '10101', message: 'Title word limit is 100 characters' },
			{ code: '10102', message: 'Start time must be less than end time' },
		]);
	});
	it('should return error when oneOffTimeslots booked overlapping', async () => {
		await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: START_TIME_1,
			endTime: END_TIME_1,
			capacity: 1,
			title: 'title1',
			description: 'Description',
		});
		const [response] = await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: START_TIME_1,
			endTime: END_TIME_1,
			capacity: 1,
			title: 'title2',
			description: 'Description',
		});

		expect(response.statusCode).toEqual(400);
		expect(response.body).toEqual({
			errorCode: 'SYS_INVALID_PARAM',
			errorMessage: 'Slot cannot be created as it overlaps with an existing slot.',
		});
	});
	it('should return error when oneOffTimeslots updated overlapping', async () => {
		await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: START_TIME_1,
			endTime: END_TIME_1,
			capacity: 1,
			title: 'title1',
			description: 'Description',
		});
		const [, service2TimeslotsResponse] = await populateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: START_TIME_2,
			endTime: END_TIME_2,
			capacity: 1,
			title: 'title2',
			description: 'Description',
		});
		const { idSigned } = service2TimeslotsResponse;
		const [response] = await updateOneOffTimeslot({
			serviceProviderId: serviceProvider1.id,
			startTime: START_TIME_1,
			endTime: END_TIME_1,
			capacity: 1,
			title: 'title2',
			description: 'Description',
			idSigned,
		});

		expect(response.statusCode).toEqual(400);
		expect(response.body).toEqual({
			errorCode: 'SYS_INVALID_PARAM',
			errorMessage: 'Slot cannot be created as it overlaps with an existing slot.',
		});
	});
});
