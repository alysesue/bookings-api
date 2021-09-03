import { Container } from 'typescript-ioc';
import { TimeslotsController, TimeslotsControllerV2 } from '../timeslots.controller';
import { TimeslotsService } from '../timeslots.service';
import { AvailableTimeslotProviders } from '../availableTimeslotProviders';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { Organisation, ServiceProvider, User } from '../../../models';
import { OrganisationAdminAuthGroup, ServiceProviderAuthGroup } from '../../../infrastructure/auth/authGroup';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { ServiceProvidersLookup } from '../aggregatorTimeslotProviders';
import { MOLErrorV2 } from 'mol-lib-api-contract';
import { IdHasherMock } from '../../../infrastructure/__mocks__/idHasher.mock';
import { IdHasher } from '../../../infrastructure/idHasher';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const TimeslotsServiceMock = {
	getAggregatedTimeslots: jest.fn(() => Promise.resolve([])),
};

const adminUserMock = User.createAdminUser({
	molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
	agencyUserId: 'ABC1234',
	email: 'john@email.com',
	userName: 'JohnAdmin',
	name: 'John',
});

const organisation = new Organisation();
organisation.id = 1;

describe('Timeslots Controller V1', () => {
	beforeEach(() => {
		jest.resetAllMocks();

		Container.bind(TimeslotsService).to(jest.fn(() => TimeslotsServiceMock));
		Container.bind(UserContext).to(UserContextMock);

		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(adminUserMock, [organisation])]),
		);

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminUserMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(adminUserMock, [organisation])]),
		);

		UserContextMock.getSnapshot.mockReturnValue(
			Promise.resolve({
				user: adminUserMock,
				authGroups: [new OrganisationAdminAuthGroup(adminUserMock, [organisation])],
			}),
		);
	});

	it('should get availability', async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsController);
		const start = new Date();
		const end = DateHelper.addHours(start, 12);
		const result = await controller.getAvailability(start, end, 1, 100);

		expect(result).toBeDefined();
		// zero availabilityCount not returned
		expect(result.data.length).toBe(0);
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: start,
			endDateTime: end,
			filterDaysInAdvance: true,
			includeBookings: false,
			labelIds: [],
			serviceId: 1,
			serviceProviderIds: [100],
		});
	});

	it('should get timeslots', async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsController);
		const start = new Date();
		const end = DateHelper.addHours(start, 12);
		const result = await controller.getTimeslots(start, end, 1, false, [100]);

		expect(result).toBeDefined();
		expect(result.data.length).toBe(1);
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: start,
			endDateTime: end,
			filterDaysInAdvance: false,
			includeBookings: false,
			labelIds: [],
			serviceId: 1,
			serviceProviderIds: [100],
		});
	});

	it('should get timeslots - as a service provider', async () => {
		const serviceProvider = ServiceProvider.create('John', 1);
		serviceProvider.id = 2;
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceProviderAuthGroup(adminUserMock, serviceProvider)]),
		);

		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsController);
		const startTime = DateHelper.addMinutes(new Date(), -30);
		const endTime = DateHelper.addMinutes(new Date(), 30);
		const result = await controller.getTimeslots(startTime, endTime, 1, false);

		expect(result).toBeDefined();
		expect(result.data.length).toBe(1);
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: startTime,
			endDateTime: endTime,
			serviceId: 1,
			includeBookings: false,
			serviceProviderIds: [2],
			labelIds: [],
			filterDaysInAdvance: false,
		});
	});

	it('should allow fetching of availability for 31 days less 1 minute', async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsController);
		const startTime = new Date('2021-04-30T18:01:00.000Z');
		const endTime = new Date('2021-05-31T18:00:00.000Z');
		await controller.getAvailabilityByDay(startTime, endTime, 1);

		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: startTime,
			endDateTime: endTime,
			serviceId: 1,
			includeBookings: false,
			serviceProviderIds: undefined,
			filterDaysInAdvance: false,
		});
	});

	it('should allow fetching of availability for exactly 31 days', async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsController);
		const startTime = new Date('2021-04-30T18:00:00.000Z');
		const endTime = new Date('2021-05-31T18:00:00.000Z');
		await controller.getAvailabilityByDay(startTime, endTime, 1);

		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: startTime,
			endDateTime: endTime,
			serviceId: 1,
			includeBookings: false,
			serviceProviderIds: undefined,
			filterDaysInAdvance: false,
		});
	});

	it('should not allow fetching of availability for 31 days and 1 minute', async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsController);
		const startTime = new Date('2021-04-30T17:59:00.000Z'); // exceed by 1 min
		const endTime = new Date('2021-05-31T18:00:00.000Z');
		await expect(controller.getAvailabilityByDay(startTime, endTime, 1)).rejects.toThrowError(MOLErrorV2);

		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledTimes(0);
	});

	it('should get availability grouped by date', async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsController);
		const startTime = DateHelper.addMinutes(new Date(), -30);
		const endTime = DateHelper.addMinutes(new Date(), 30);
		await controller.getAvailabilityByDay(startTime, endTime, 1);

		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: startTime,
			endDateTime: endTime,
			serviceId: 1,
			includeBookings: false,
			serviceProviderIds: undefined,
			filterDaysInAdvance: false,
		});
	});

	it('should filter out invalid id - as a service provider', async () => {
		const serviceProvider = ServiceProvider.create('John', 1);
		serviceProvider.id = 2;
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceProviderAuthGroup(adminUserMock, serviceProvider)]),
		);

		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsController);
		const startTime = DateHelper.addMinutes(new Date(), -30);
		const endTime = DateHelper.addMinutes(new Date(), 30);
		const result = await controller.getTimeslots(startTime, endTime, 1, false, [100]);

		expect(result).toBeDefined();
		expect(result.data.length).toBe(1);
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: startTime,
			endDateTime: endTime,
			serviceId: 1,
			includeBookings: false,
			serviceProviderIds: [0],
			labelIds: [],
			filterDaysInAdvance: false,
		});
	});
});

describe('Timeslots Controller V2', () => {
	beforeEach(() => {
		jest.resetAllMocks();

		Container.bind(TimeslotsService).to(jest.fn(() => TimeslotsServiceMock));
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(IdHasher).to(IdHasherMock);

		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(adminUserMock, [organisation])]),
		);

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminUserMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(adminUserMock, [organisation])]),
		);

		UserContextMock.getSnapshot.mockReturnValue(
			Promise.resolve({
				user: adminUserMock,
				authGroups: [new OrganisationAdminAuthGroup(adminUserMock, [organisation])],
			}),
		);
	});

	it('should get availability', async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsControllerV2);
		const start = new Date();
		const end = DateHelper.addHours(start, 12);
		const serviceId = '1';
		const serviceProviderId = '1';
		IdHasherMock.decode.mockImplementation(() => Number.parseInt(serviceId, 10));
		IdHasherMock.decode.mockImplementation(() => Number.parseInt(serviceProviderId, 10));
		const result = await controller.getAvailability(start, end, serviceId, serviceProviderId);

		expect(result).toBeDefined();
		// zero availabilityCount not returned
		expect(result.data.length).toBe(0);
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: start,
			endDateTime: end,
			filterDaysInAdvance: true,
			includeBookings: false,
			labelIds: [],
			serviceId: 1,
			serviceProviderIds: [1],
		});
	});

	it('should get timeslots', async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsControllerV2);
		const start = new Date();
		const end = DateHelper.addHours(start, 12);
		const serviceId = '1';
		const serviceProviderId = '1';
		IdHasherMock.decode.mockImplementation(() => Number.parseInt(serviceId, 10));
		IdHasherMock.decode.mockImplementation(() => Number.parseInt(serviceProviderId, 10));
		const result = await controller.getTimeslots(start, end, serviceId, false, [serviceProviderId]);

		expect(result).toBeDefined();
		expect(result.data.length).toBe(1);
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: start,
			endDateTime: end,
			filterDaysInAdvance: false,
			includeBookings: false,
			labelIds: [],
			serviceId: 1,
			serviceProviderIds: [1],
		});
	});

	it('should get timeslots - as a service provider', async () => {
		const serviceProvider = ServiceProvider.create('John', 1);
		serviceProvider.id = 2;
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceProviderAuthGroup(adminUserMock, serviceProvider)]),
		);

		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsControllerV2);
		const startTime = DateHelper.addMinutes(new Date(), -30);
		const endTime = DateHelper.addMinutes(new Date(), 30);
		const serviceId = '1';
		const serviceProviderId = '1';
		IdHasherMock.decode.mockImplementation(() => Number.parseInt(serviceId, 10));
		IdHasherMock.decode.mockImplementation(() => Number.parseInt(serviceProviderId, 10));
		const result = await controller.getTimeslots(startTime, endTime, serviceId, false, [serviceProviderId]);

		expect(result).toBeDefined();
		expect(result.data.length).toBe(1);
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: startTime,
			endDateTime: endTime,
			serviceId: 1,
			includeBookings: false,
			serviceProviderIds: [0],
			labelIds: [],
			filterDaysInAdvance: false,
		});
	});

	it('should allow fetching of availability for 31 days less 1 minute', async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsControllerV2);
		const startTime = new Date('2021-04-30T18:01:00.000Z');
		const endTime = new Date('2021-05-31T18:00:00.000Z');
		const serviceId = '1';
		const serviceProviderId = '1';
		IdHasherMock.decode.mockImplementation(() => Number.parseInt(serviceId, 10));
		IdHasherMock.decode.mockImplementation(() => Number.parseInt(serviceProviderId, 10));
		await controller.getAvailabilityByDay(startTime, endTime, serviceId, [serviceProviderId]);

		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: startTime,
			endDateTime: endTime,
			serviceId: 1,
			includeBookings: false,
			serviceProviderIds: [1],
			filterDaysInAdvance: false,
		});
	});

	it('should allow fetching of availability for exactly 31 days', async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsControllerV2);
		const startTime = new Date('2021-04-30T18:00:00.000Z');
		const endTime = new Date('2021-05-31T18:00:00.000Z');
		const serviceId = '1';
		const serviceProviderId = '1';
		IdHasherMock.decode.mockImplementation(() => Number.parseInt(serviceId, 10));
		IdHasherMock.decode.mockImplementation(() => Number.parseInt(serviceProviderId, 10));
		await controller.getAvailabilityByDay(startTime, endTime, serviceId, [serviceProviderId]);

		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: startTime,
			endDateTime: endTime,
			serviceId: 1,
			includeBookings: false,
			serviceProviderIds: [1],
			filterDaysInAdvance: false,
		});
	});

	it('should not allow fetching of availability for 31 days and 1 minute', async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsControllerV2);
		const startTime = new Date('2021-04-30T17:59:00.000Z'); // exceed by 1 min
		const endTime = new Date('2021-05-31T18:00:00.000Z');
		const serviceId = '1';
		IdHasherMock.decode.mockImplementation(() => Number.parseInt(serviceId, 10));
		await expect(controller.getAvailabilityByDay(startTime, endTime, serviceId)).rejects.toThrowError(MOLErrorV2);

		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledTimes(0);
	});

	it('should get availability grouped by date', async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsControllerV2);
		const startTime = DateHelper.addMinutes(new Date(), -30);
		const endTime = DateHelper.addMinutes(new Date(), 30);
		const serviceId = '1';
		const serviceProviderId = '1';
		IdHasherMock.decode.mockImplementation(() => Number.parseInt(serviceId, 10));
		IdHasherMock.decode.mockImplementation(() => Number.parseInt(serviceProviderId, 10));
		await controller.getAvailabilityByDay(startTime, endTime, serviceId, [serviceProviderId]);

		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: startTime,
			endDateTime: endTime,
			serviceId: 1,
			includeBookings: false,
			serviceProviderIds: [1],
			filterDaysInAdvance: false,
		});
	});

	it('should filter out invalid id - as a service provider', async () => {
		const serviceProvider = ServiceProvider.create('John', 1);
		serviceProvider.id = 2;
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceProviderAuthGroup(adminUserMock, serviceProvider)]),
		);

		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			const date = new Date();
			entry.startTime = date.getTime();
			entry.endTime = DateHelper.addMinutes(date, 30).getTime();
			return Promise.resolve([entry]);
		});

		const controller = Container.get(TimeslotsControllerV2);
		const startTime = DateHelper.addMinutes(new Date(), -30);
		const endTime = DateHelper.addMinutes(new Date(), 30);
		const serviceId = '1';
		const serviceProviderId = '1';
		IdHasherMock.decode.mockImplementation(() => Number.parseInt(serviceId, 10));
		IdHasherMock.decode.mockImplementation(() => Number.parseInt(serviceProviderId, 10));
		const result = await controller.getTimeslots(startTime, endTime, serviceId, false, [serviceProviderId]);

		expect(result).toBeDefined();
		expect(result.data.length).toBe(1);
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: startTime,
			endDateTime: endTime,
			serviceId: 1,
			includeBookings: false,
			serviceProviderIds: [0],
			labelIds: [],
			filterDaysInAdvance: false,
		});
	});
});
