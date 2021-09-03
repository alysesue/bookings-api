import { Container } from 'typescript-ioc';
import { cloneDeep } from 'lodash';
import { ServiceProvidersService } from '../serviceProviders.service';
import { ServiceProvidersRepository } from '../serviceProviders.repository';
import {
	Organisation,
	OrganisationAdminGroupMap,
	ScheduleForm,
	Service,
	ServiceProvider,
	TimeOfDay,
	TimeslotItem,
	TimeslotsSchedule,
	User,
} from '../../../models';
import { MolServiceProviderOnboard } from '../serviceProviders.apicontract';
import { ScheduleFormsService } from '../../scheduleForms/scheduleForms.service';
import { TimeslotsScheduleRepository } from '../../timeslotsSchedules/timeslotsSchedule.repository';
import { TimeslotItemsService } from '../../timeslotItems/timeslotItems.service';
import { Weekday } from '../../../enums/weekday';
import { TimeslotItemRequest } from '../../timeslotItems/timeslotItems.apicontract';
import { ServicesService } from '../../services/services.service';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { AvailableTimeslotProviders } from '../../timeslots/availableTimeslotProviders';
import { UserContext } from '../../../infrastructure/auth/userContext';
import {
	OrganisationAdminAuthGroup,
	ServiceAdminAuthGroup,
	ServiceProviderAuthGroup,
} from '../../../infrastructure/auth/authGroup';
import { TimeslotWithCapacity } from '../../../models/timeslotWithCapacity';
import { ScheduleFormRequest } from '../../scheduleForms/scheduleForms.apicontract';
import { MolUsersService } from '../../users/molUsers/molUsers.service';
import { IMolCognitoUserResponse } from '../../users/molUsers/molUsers.apicontract';
import { OrganisationsNoauthRepository } from '../../organisations/organisations.noauth.repository';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { MolUsersServiceMock } from '../../users/molUsers/__mocks__/molUsers.service';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { UsersServiceMock } from '../../users/__mocks__/users.service';
import { UsersService } from '../../users/users.service';
import { ServicesServiceMock } from '../../services/__mocks__/services.service';
import { ServiceProvidersActionAuthVisitor } from '../serviceProviders.auth';
import { ServiceProvidersLookup } from '../../timeslots/aggregatorTimeslotProviders';
import { TimeslotsServiceMock } from '../../bookings/__mocks__/bookings.mocks';
import { ServiceProvidersRepositoryMock } from '../__mocks__/serviceProviders.repository.mock';
import { TimeslotItemsServiceMock } from '../../timeslotItems/__mocks__/timeslotItems.service.mock';
import { ScheduleFormsServiceMock } from '../../scheduleForms/__mocks__/scheduleForms.service.mock';
import { TimeslotsScheduleRepositoryMock } from '../../timeslotsSchedules/__mocks__/timeslotsSchedule.repository.mock';
import { OrganisationsRepositoryMock } from '../../organisations/__mocks__/organisations.noauth.repository.mock';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const createTimeslot = (startTime: Date, endTime: Date, capacity?: number) => {
	return {
		startTimeNative: startTime.getTime(),
		endTimeNative: endTime.getTime(),
		capacity: capacity || 1,
	} as TimeslotWithCapacity;
};

jest.mock('../serviceProviders.auth');

// tslint:disable-next-line:no-big-function
describe('ServiceProviders.Service', () => {
	const serviceProviderMock = ServiceProvider.create('Name', 0);
	const serviceProviderModelMock = { name: 'Name', expiryDate: new Date() };
	const serviceProviderMockWithTemplate = ServiceProvider.create('Provider 2', 0);
	const timeslotItemMock = TimeslotItem.create(
		1,
		Weekday.Monday,
		TimeOfDay.create({
			hours: 11,
			minutes: 0,
		}),
		TimeOfDay.create({ hours: 11, minutes: 30 }),
		undefined,
		undefined,
	);
	const timeslotsScheduleMock = new TimeslotsSchedule();
	timeslotsScheduleMock._serviceProvider = serviceProviderMock;
	const serviceMockWithTemplate = new Service();
	const request = new TimeslotItemRequest();
	const organisation = new Organisation();
	organisation.id = 1;
	organisation._organisationAdminGroupMap = new OrganisationAdminGroupMap();
	organisation._organisationAdminGroupMap.organisationRef = 'orgTest';

	const serviceProvider = ServiceProvider.create('Peter', 1, 'test@email.com', '0000');
	serviceProvider.id = 1;
	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});
	const singpassMock = User.createSingPassUser('d080f6ed-3b47-478a-a6c6-dfb5608a199d', 'ABC1234');

	beforeAll(() => {
		Container.bind(TimeslotsScheduleRepository).to(TimeslotsScheduleRepositoryMock);
		Container.bind(TimeslotItemsService).to(TimeslotItemsServiceMock);
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		Container.bind(ServicesService).to(ServicesServiceMock);
		Container.bind(ScheduleFormsService).to(ScheduleFormsServiceMock);
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(UsersService).to(UsersServiceMock);
		Container.bind(MolUsersService).to(MolUsersServiceMock);
		Container.bind(OrganisationsNoauthRepository).to(OrganisationsRepositoryMock);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	beforeEach(() => {
		serviceProviderMock.id = 1;
		serviceProviderMock.serviceId = 1;
		serviceProviderMock.name = 'Service Provider';
		serviceProviderMock.timeslotsSchedule = undefined;

		timeslotItemMock._id = 4;

		timeslotsScheduleMock._id = 1;

		serviceProviderMockWithTemplate.id = 1;
		serviceProviderMockWithTemplate.timeslotsScheduleId = timeslotsScheduleMock._id;
		serviceProviderMockWithTemplate.timeslotsSchedule = cloneDeep(timeslotsScheduleMock);
		serviceProviderMockWithTemplate.timeslotsSchedule.timeslotItems = [timeslotItemMock];

		serviceMockWithTemplate.id = 1;
		serviceMockWithTemplate.name = 'service';
		serviceMockWithTemplate.timeslotsScheduleId = timeslotsScheduleMock._id;
		serviceMockWithTemplate.timeslotsSchedule = cloneDeep(timeslotsScheduleMock);
		serviceMockWithTemplate.timeslotsSchedule.timeslotItems = [timeslotItemMock];
		serviceMockWithTemplate.organisationId = 1;

		request.weekDay = Weekday.Thursday;
		request.startTime = '11:00';
		request.endTime = '12:00';
		(ServiceProvidersActionAuthVisitor as jest.Mock).mockImplementation(() => ({
			hasPermission: jest.fn().mockReturnValue(true),
		}));
	});

	it('should get all service providers', async () => {
		ServiceProvidersRepositoryMock.getServiceProviders.mockReturnValue(Promise.resolve([serviceProviderMock]));
		const result = await Container.get(ServiceProvidersService).getServiceProviders();
		expect(result.length).toBe(1);
	});

	it('should get service provider by Id', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		const result = await Container.get(ServiceProvidersService).getServiceProvider(1, true, true);
		expect(result.name).toBe('Service Provider');
	});

	it('should throw error when service provider is not found', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = null;
		await expect(
			async () => await Container.get(ServiceProvidersService).getServiceProvider(1, true, true),
		).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service provider with id 1 not found'),
		);
	});

	it('should onboard a list of service providers', async () => {
		const spOnboard = {
			name: 'aa',
			serviceName: 'service 1',
			agencyUserId: 'asd',
			email: 'email',
			autoAcceptBookings: false,
		} as MolServiceProviderOnboard;
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [serviceMockWithTemplate])]),
		);
		const molUserContract = {
			...spOnboard,
			sub: 'd080f6ed-3b47-478a-a6c6-dfb5608a198d',
			username: 'username',
			groups: ['bookingsg:service-provider:orgTest'],
		} as IMolCognitoUserResponse;

		MolUsersServiceMock.molUpsertUser.mockImplementation(() => Promise.resolve({ created: [molUserContract] }));
		UserContextMock.getFirstAuthorisedOrganisation.mockReturnValue(Promise.resolve(organisation));

		ServicesServiceMock.getServices.mockReturnValue(Promise.resolve([]));
		ServicesServiceMock.createServices.mockReturnValue(Promise.resolve([{ name: 'service 1' }]));
		ServiceProvidersRepositoryMock.getServiceProviders.mockReturnValue(Promise.resolve([] as ServiceProvider[]));

		await Container.get(ServiceProvidersService).createServiceProviders([spOnboard], '');
		expect(ServiceProvidersRepositoryMock.getServiceProviders).toBeCalled();
		expect(ServiceProvidersRepositoryMock.saveMany).toBeCalled();
	});

	it('should save a service provider', async () => {
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(adminMock, [organisation])]),
		);

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		ServiceProvidersRepositoryMock.save.mockImplementation(() => serviceProviderMock);
		await Container.get(ServiceProvidersService).saveServiceProviders([serviceProviderModelMock], 1);
		expect(ServiceProvidersRepositoryMock.save).toBeCalled();
	});

	it('should not save service provider and throw error', async () => {
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(adminMock, [organisation])]),
		);

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		try {
			await Container.get(ServiceProvidersService).saveServiceProviders(
				[{ ...serviceProviderModelMock, phone: 'dd', email: 'ss', expiryDate: new Date() }],
				1,
			);
		} catch (e) {
			expect(e.message).toBe('Service providers are incorrect');
		}
		expect(ServiceProvidersRepositoryMock.save).toBeCalledTimes(0);
	});

	describe('Set scheduleForm', () => {
		it('Set scheduleFrom for serviceProviders (schedule dates empty)', async () => {
			ServiceProvidersRepositoryMock.getServiceProviders.mockReturnValue(Promise.resolve([serviceProviderMock]));
			ScheduleFormsServiceMock.updateScheduleFormInEntity.mockImplementation(() => {
				serviceProviderMock.scheduleForm = new ScheduleForm();
				return Promise.resolve(serviceProviderMock);
			});
			await Container.get(ServiceProvidersService).setProvidersScheduleForm(1, {
				serviceProvidersEmailList: [],
			} as ScheduleFormRequest);
			expect(ScheduleFormsServiceMock.updateScheduleFormInEntity).toBeCalled();
		});

		it('Set scheduleFrom for serviceProviders should pass (schedul dates valid))', async () => {
			ServiceProvidersRepositoryMock.getServiceProviders.mockReturnValue(Promise.resolve([serviceProviderMock]));
			ScheduleFormsServiceMock.updateScheduleFormInEntity.mockImplementation(() => {
				serviceProviderMock.scheduleForm = new ScheduleForm();
				return Promise.resolve(serviceProviderMock);
			});
			await Container.get(ServiceProvidersService).setProvidersScheduleForm(1, {
				serviceProvidersEmailList: [],
				startDate: new Date('2021-07-07'),
				endDate: new Date('2021-07-08'),
			} as ScheduleFormRequest);
			expect(ScheduleFormsServiceMock.updateScheduleFormInEntity).toBeCalled();
		});

		it('Set scheduleForm should throw error if schedule end date is earlier than start date', async () => {
			let error;
			try {
				await Container.get(ServiceProvidersService).setProvidersScheduleForm(1, {
					serviceProvidersEmailList: [],
					startDate: new Date('2021-07-08'),
					endDate: new Date('2021-07-07'),
				} as ScheduleFormRequest);
			} catch (e) {
				error = e;
			}
			expect(error.code).toBe('SYS_INVALID_PARAM');
			expect(error.message).toBe('End date cannot be earlier than start date');
		});

		it('Set scheduleForm should throw error if one of the schedule dates are missing', async () => {
			let errorStart;
			let errorEnd;
			try {
				await Container.get(ServiceProvidersService).setProvidersScheduleForm(1, {
					serviceProvidersEmailList: [],
					startDate: new Date('2021-07-08'),
				} as ScheduleFormRequest);
			} catch (e) {
				errorStart = e;
			}
			try {
				await Container.get(ServiceProvidersService).setProvidersScheduleForm(1, {
					serviceProvidersEmailList: [],
					endDate: new Date('2021-07-08'),
				} as ScheduleFormRequest);
			} catch (e) {
				errorEnd = e;
			}
			expect(errorStart.code).toBe('SYS_INVALID_PARAM');
			expect(errorStart.message).toBe('Both the start date and end date must be selected or empty');
			expect(errorEnd.code).toBe('SYS_INVALID_PARAM');
			expect(errorEnd.message).toBe('Both the start date and end date must be selected or empty');
		});
	});

	it('Filter service providers without request email inputs', async () => {
		const serviceProviderMock1 = ServiceProvider.create('sp1', 1, 'sp1@gmail.com');
		const serviceProviderMock2 = ServiceProvider.create('sp2', 1, 'sp2@gmail.com');
		const serviceProviderMock3 = ServiceProvider.create('sp3', 1, 'sp3@gmail.com');
		const serviceProviders = [serviceProviderMock1, serviceProviderMock2, serviceProviderMock3];
		const request = {
			serviceProvidersEmailList: [],
		} as ScheduleFormRequest;

		const result = Container.get(ServiceProvidersService).getFilteredServiceProvidersByEmail(
			request,
			serviceProviders,
		);

		expect(result.length).toEqual(3);
		expect(result).toEqual(serviceProviders);
	});

	it('Filter service providers with request email inputs', async () => {
		const serviceProviderMock1 = ServiceProvider.create('sp1', 1, 'sp1@gmail.com');
		const serviceProviderMock2 = ServiceProvider.create('sp2', 1, 'sp2@gmail.com');
		const serviceProviderMock3 = ServiceProvider.create('sp3', 1, 'sp3@gmail.com');
		const serviceProviders = [serviceProviderMock1, serviceProviderMock2, serviceProviderMock3];
		const request = {
			serviceProvidersEmailList: ['sp1@gmail.com', 'sp3@gmail.com'],
		} as ScheduleFormRequest;

		const result = Container.get(ServiceProvidersService).getFilteredServiceProvidersByEmail(
			request,
			serviceProviders,
		);

		const spEmails = [result[0], result[1]];
		const expectedServiceProviders = [serviceProviderMock1, serviceProviderMock3];
		expect(result.length).toEqual(2);
		expect(spEmails).toEqual(expectedServiceProviders);
	});

	it('should set provider schedule', async () => {
		UserContextMock.getAuthGroups.mockReturnValue(
			Promise.resolve([new OrganisationAdminAuthGroup(adminMock, [organisation])]),
		);
		const serviceProviderData = ServiceProvider.create(
			'Peter',
			serviceMockWithTemplate.id,
			'test@email.com',
			'0000',
		);
		serviceProviderData.service = serviceMockWithTemplate;
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderData;
		ScheduleFormsServiceMock.updateScheduleFormInEntity.mockImplementation(() => {
			serviceProviderData.scheduleForm = new ScheduleForm();
			return Promise.resolve(serviceProviderData);
		});

		const providerScheduleRequest = new ScheduleFormRequest();
		await Container.get(ServiceProvidersService).setProviderScheduleForm(1, providerScheduleRequest);

		expect(ScheduleFormsServiceMock.updateScheduleFormInEntity).toBeCalled();
	});

	it('should update a service provider', async () => {
		serviceProviderMock.service = serviceMockWithTemplate;
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		ServiceProvidersRepositoryMock.save.mockImplementation(() => serviceProviderMock);
		UserContextMock.getAuthGroups.mockReturnValue(
			Promise.resolve([new OrganisationAdminAuthGroup(adminMock, [organisation])]),
		);
		await Container.get(ServiceProvidersService).updateSp(serviceProviderModelMock, 1);
		expect(ServiceProvidersRepositoryMock.save).toBeCalled();
	});

	it('should get provider schedule', async () => {
		serviceProviderMock.scheduleForm = new ScheduleForm();
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;

		const schedule = await Container.get(ServiceProvidersService).getProviderScheduleForm(1);
		expect(schedule).toBeDefined();
	});

	it('should throw error when service provider schedule form is not found', async () => {
		serviceProviderMock.scheduleForm = null;
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;

		await expect(
			async () => await Container.get(ServiceProvidersService).getProviderScheduleForm(1),
		).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service schedule form not found'),
		);
	});

	it('should get timeslots schedule for service provider', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMockWithTemplate;
		const serviceProvidersService = Container.get(ServiceProvidersService);
		const timeslotsScheduleResponse = await serviceProvidersService.getTimeslotItems(1);
		expect(timeslotsScheduleResponse.timeslotItems[0]._weekDay).toBe(
			serviceProviderMockWithTemplate.timeslotsSchedule.timeslotItems[0]._weekDay,
		);
	});

	it('should get timeslots schedule from service if no timeslots schedule provider', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		ServicesServiceMock.getServiceTimeslotsSchedule.mockReturnValue(serviceMockWithTemplate.timeslotsSchedule);
		const serviceProvidersService = Container.get(ServiceProvidersService);
		const timeslotsScheduleResponse = await serviceProvidersService.getTimeslotItems(1);
		expect(timeslotsScheduleResponse.timeslotItems[0]._weekDay).toBe(
			serviceMockWithTemplate.timeslotsSchedule.timeslotItems[0]._weekDay,
		);
	});

	it('should add timeslots schedule for service provider', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMockWithTemplate;
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceProviderAuthGroup(adminMock, serviceProvider)]),
		);

		const serviceProvidersService = Container.get(ServiceProvidersService);
		await serviceProvidersService.addTimeslotItem(1, request);
		TimeslotItemsServiceMock.createTimeslotItem.mockImplementation(() => Promise.resolve(timeslotItemMock));
		expect(ServiceProvidersRepositoryMock.save).toBeCalledTimes(0);
		expect(TimeslotItemsServiceMock.createTimeslotItem).toBeCalledTimes(1);
	});

	it('should copy timeslots item  service to  service provider and save it', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		ServicesServiceMock.getServiceTimeslotsSchedule.mockReturnValue(serviceMockWithTemplate.timeslotsSchedule);
		ServiceProvidersRepositoryMock.save.mockImplementation(() => serviceProviderMockWithTemplate);

		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceProviderAuthGroup(adminMock, serviceProviderMockWithTemplate)]),
		);

		TimeslotItemsServiceMock.createTimeslotItem.mockImplementation(() => Promise.resolve(timeslotItemMock));

		const serviceProvidersService = Container.get(ServiceProvidersService);
		await serviceProvidersService.addTimeslotItem(1, request);
		expect(ServiceProvidersRepositoryMock.save).toBeCalledTimes(1);
		expect(TimeslotItemsServiceMock.createTimeslotItem).toBeCalledTimes(1);
	});

	it('should update timeslots schedule service provider', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMockWithTemplate;

		const serviceProvidersService = Container.get(ServiceProvidersService);
		await serviceProvidersService.updateTimeslotItem(1, 4, request);
		expect(ServiceProvidersRepositoryMock.save).toBeCalledTimes(0);
		expect(TimeslotItemsServiceMock.mapAndSaveTimeslotItem).toBeCalledTimes(1);
	});

	it('should copy timeslots schedule item for service to service provider and update', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		ServicesServiceMock.getServiceTimeslotsSchedule.mockReturnValue(serviceMockWithTemplate.timeslotsSchedule);

		const serviceProvidersService = Container.get(ServiceProvidersService);
		await serviceProvidersService.updateTimeslotItem(1, 4, request);
		expect(ServiceProvidersRepositoryMock.save).toBeCalledTimes(1);
		expect(TimeslotItemsServiceMock.mapAndSaveTimeslotItem).toBeCalledTimes(0);
	});

	it('should delete timeslot item for service provider', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMockWithTemplate;
		const serviceProvidersService = Container.get(ServiceProvidersService);
		await serviceProvidersService.deleteTimeslotItem(1, 4);
		expect(ServiceProvidersRepositoryMock.save).toBeCalledTimes(0);
		expect(TimeslotItemsServiceMock.deleteTimeslot).toBeCalledTimes(1);
	});

	it('should copy timeslots of service  for service provider and not adding the target timeslots', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		ServicesServiceMock.getServiceTimeslotsSchedule.mockReturnValue(serviceMockWithTemplate.timeslotsSchedule);
		const serviceProvidersService = Container.get(ServiceProvidersService);
		await serviceProvidersService.deleteTimeslotItem(1, 4);
		expect(ServiceProvidersRepositoryMock.save).toBeCalledTimes(1);
		expect(TimeslotItemsServiceMock.deleteTimeslot).toBeCalledTimes(0);
	});

	it('should return only available service providers', async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders(new ServiceProvidersLookup());
			entry.startTime = new Date(2020, 8, 26, 8, 0).getTime();
			entry.endTime = new Date(2020, 8, 26, 8, 30).getTime();

			const serviceProvider1 = ServiceProvider.create('Juku', 1);
			serviceProvider1.id = 1;
			const serviceProvider2 = ServiceProvider.create('Andi', 1);
			serviceProvider2.id = 2;

			entry.addServiceProvider(
				serviceProvider1,
				createTimeslot(new Date(entry.startTime), new Date(entry.endTime), 1),
			);
			entry.addServiceProvider(
				serviceProvider2,
				createTimeslot(new Date(entry.startTime), new Date(entry.endTime), 1),
			);

			return Promise.resolve([entry]);
		});

		const serviceProvidersService = Container.get(ServiceProvidersService);
		const start = new Date('2020-08-25T12:00');
		const end = new Date('2020-08-26T12:00');
		const availableServiceProviders = await serviceProvidersService.getAvailableServiceProviders(
			start,
			end,
			true,
			1,
		);

		expect(TimeslotsServiceMock.getAggregatedTimeslots).toBeCalledWith({
			startDateTime: start,
			endDateTime: end,
			filterDaysInAdvance: true,
			includeBookings: false,
			serviceId: 1,
		});
		expect(availableServiceProviders).toHaveLength(2);
	});

	it('should return the total count of service providers', async () => {
		ServiceProvidersRepositoryMock.getServiceProvidersCountMock = 5;

		const serviceProvidersService = Container.get(ServiceProvidersService);
		const totalCount = await serviceProvidersService.getServiceProvidersCount(1, true, true);

		expect(totalCount).toBe(5);
	});
	it('should search SP by name', async () => {
		ServiceProvidersRepositoryMock.getServiceProvidersByName.mockReturnValue(
			Promise.resolve([serviceProviderMock]),
		);
		const serviceProvidersService = Container.get(ServiceProvidersService);
		const result = await serviceProvidersService.getServiceProvidersByName('mon', 1);
		expect(result.length).toBe(1);
	});
});
