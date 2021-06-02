import { TimeslotsMapper } from './../timeslots.mapper';
import { Container } from 'typescript-ioc';
import { TimeslotsController } from '../timeslots.controller';
import { TimeslotsService } from '../timeslots.service';
import { AvailableTimeslotProviders } from '../availableTimeslotProviders';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { Organisation, ServiceProvider, User } from '../../../models';
import { OrganisationAdminAuthGroup, ServiceProviderAuthGroup } from '../../../infrastructure/auth/authGroup';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { ServiceProvidersLookup } from '../aggregatorTimeslotProviders';
import { MOLErrorV2 } from 'mol-lib-api-contract';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

jest.mock('mol-lib-common', () => {
	const actual = jest.requireActual('mol-lib-common');
	const mock = () => {
		return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => descriptor;
	};
	return {
		...actual,
		MOLAuth: mock,
	};
});

const TimeslotsServiceMock = {
	getAggregatedTimeslots: jest.fn(() => Promise.resolve([])),
};

const TimeslotsMapperMock = {
	groupAvailabilityByDateResponse: jest.fn(),
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

describe('Timeslots Controller', () => {
	beforeEach(() => {
		jest.resetAllMocks();

		Container.bind(TimeslotsService).to(jest.fn(() => TimeslotsServiceMock));
		Container.bind(TimeslotsMapper).to(jest.fn(() => TimeslotsMapperMock));
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
		const result = await controller.getAvailability(new Date(), new Date(), 1, 100);

		expect(result).toBeDefined();
		// zero availabilityCount not returned
		expect(result.data.length).toBe(0);
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalled();
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
		const result = await controller.getTimeslots(new Date(), new Date(), 1, false, [100]);

		expect(result).toBeDefined();
		expect(result.data.length).toBe(1);
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalled();
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
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith(startTime, endTime, 1, false, [2], []);
	});

	describe.only('get availability by day', () => {
		it('should allow fetching of availability for 31 days less 1 minute', async () => {
			const controller = Container.get(TimeslotsController);
			const startTime = new Date('2021-04-30T18:01:00.000Z');
			const endTime = new Date('2021-05-31T18:00:00.000Z');
			await controller.getAvailabilityByDay(startTime, endTime, 1);

			expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith(startTime, endTime, 1, false, undefined);
			expect(TimeslotsMapperMock.groupAvailabilityByDateResponse).toBeCalledTimes(1);
		});

		it('should allow fetching of availability for exactly 31 days', async () => {
			const controller = Container.get(TimeslotsController);
			const startTime = new Date('2021-04-30T18:00:00.000Z');
			const endTime = new Date('2021-05-31T18:00:00.000Z');
			await controller.getAvailabilityByDay(startTime, endTime, 1);

			expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith(startTime, endTime, 1, false, undefined);
			expect(TimeslotsMapperMock.groupAvailabilityByDateResponse).toBeCalledTimes(1);
		});

		it('should not allow fetching of availability for 31 days and 1 minute', async () => {
			const controller = Container.get(TimeslotsController);
			const startTime = new Date('2021-04-30T17:59:00.000Z'); // exceed by 1 min
			const endTime = new Date('2021-05-31T18:00:00.000Z');
			await expect(controller.getAvailabilityByDay(startTime, endTime, 1)).rejects.toThrowError(MOLErrorV2);

			expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledTimes(0);
			expect(TimeslotsMapperMock.groupAvailabilityByDateResponse).toBeCalledTimes(0);
		});

		it('should get availability grouped by date', async () => {
			const controller = Container.get(TimeslotsController);
			const startTime = DateHelper.addMinutes(new Date(), -30);
			const endTime = DateHelper.addMinutes(new Date(), 30);
			await controller.getAvailabilityByDay(startTime, endTime, 1);

			expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith(startTime, endTime, 1, false, undefined);
			expect(TimeslotsMapperMock.groupAvailabilityByDateResponse).toBeCalledTimes(1);
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
		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith(startTime, endTime, 1, false, [0], []);
	});
});
