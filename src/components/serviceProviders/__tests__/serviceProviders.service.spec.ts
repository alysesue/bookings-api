import { Container } from 'typescript-ioc';
import { cloneDeep } from 'lodash';
import { DeleteResult } from 'typeorm';
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
import { MolServiceProviderOnboard, ServiceProviderModel } from '../serviceProviders.apicontract';
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
import { TimeslotItemsSearchRequest } from '../../timeslotItems/timeslotItems.repository';
import { ScheduleFormRequest } from '../../scheduleForms/scheduleForms.apicontract';
import { MolUsersService } from '../../users/molUsers/molUsers.service';
import { MolAdminUserContract } from '../../users/molUsers/molUsers.apicontract';
import { OrganisationsNoauthRepository } from '../../organisations/organisations.noauth.repository';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { MolUsersServiceMock } from '../../users/molUsers/__mocks__/molUsers.service';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { UsersServiceMock } from '../../users/__mocks__/users.service';
import { UsersService } from '../../users/users.service';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const createTimeslot = (startTime: Date, endTime: Date, capacity?: number) => {
	return { startTime, endTime, capacity: capacity || 1 } as TimeslotWithCapacity;
};

// tslint:disable-next-line:no-big-function
describe('ServiceProviders.Service', () => {
	const serviceProviderMock = ServiceProvider.create('Name', 0);
	const serviceProviderMockWithTemplate = ServiceProvider.create('Provider 2', 0);
	const timeslotItemMock = TimeslotItem.create(
		1,
		Weekday.Monday,
		TimeOfDay.create({
			hours: 11,
			minutes: 0,
		}),
		TimeOfDay.create({ hours: 11, minutes: 30 }),
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
	});

	it('should get all service providers', async () => {
		ServiceProvidersRepositoryMock.getServiceProvidersMock = [serviceProviderMock];
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
			serviceName: 'name',
			agencyUserId: 'asd',
			autoAcceptBookings: false,
		} as MolServiceProviderOnboard;
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [serviceMockWithTemplate])]),
		);
		const admins = [
			{
				name: 'name',
				email: 'email',
				phoneNumber: 'phoneNumber',
				serviceNames: ['service 1'],
			},
		] as MolAdminUserContract[];

		MolUsersServiceMock.molUpsertUser.mockImplementation(() => Promise.resolve({ created: admins }));
		UserContextMock.getFirstAuthorisedOrganisation.mockReturnValue(Promise.resolve(organisation));
		UsersServiceMock.upsertAdminUsers.mockReturnValue(Promise.resolve([spOnboard as any]));

		const res = await Container.get(ServiceProvidersService).createServiceProviders([spOnboard]);
		expect(ServicesServiceMock.getServicesCalled).toBeCalled();
		expect(res.created.length).toBe(1);
	});

	it('should throw when onboard contain error', async () => {
		const spOnboard = {
			name: 'aa',
			serviceName: 'name',
			agencyUserId: 'asd',
			autoAcceptBookings: false,
		} as MolServiceProviderOnboard;
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [serviceMockWithTemplate])]),
		);
		const admins = [
			{
				name: 'name',
				email: 'email',
				phoneNumber: 'phoneNumber',
				serviceNames: ['service 1'],
			},
		] as MolAdminUserContract[];

		MolUsersServiceMock.molUpsertUser.mockImplementation(() => Promise.resolve({ created: admins }));
		UserContextMock.getFirstAuthorisedOrganisation.mockReturnValue(Promise.resolve(organisation));
		try {
			await Container.get(ServiceProvidersService).createServiceProviders([spOnboard]);
		} catch (e) {
			expect(e.code).toBe('SYS_INVALID_PARAM');
		}
	});

	it('should save a service provider', async () => {
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(adminMock, [organisation])]),
		);

		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		ServiceProvidersRepositoryMock.save.mockImplementation(() => serviceProviderMock);
		await Container.get(ServiceProvidersService).saveServiceProviders([serviceProviderMock], 1);
		expect(ServiceProvidersRepositoryMock.save).toBeCalled();
	});

	it('Set scheduleFrom for serviceProviders', async () => {
		ServiceProvidersRepositoryMock.getServiceProvidersMock = [serviceProviderMock];
		ScheduleFormsServiceMock.updateScheduleFormInEntity.mockImplementation(() => {
			serviceProviderMock.scheduleForm = new ScheduleForm();
			return Promise.resolve(serviceProviderMock);
		});
		await Container.get(ServiceProvidersService).setProvidersScheduleForm(1, {} as ScheduleFormRequest);
		expect(ScheduleFormsServiceMock.updateScheduleFormInEntity).toBeCalled();
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
		await Container.get(ServiceProvidersService).updateSp(serviceProviderMock, 1);
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
		ServicesServiceMock.getServiceTimeslotsSchedule = serviceMockWithTemplate.timeslotsSchedule;
		const serviceProvidersService = Container.get(ServiceProvidersService);
		const timeslotsScheduleResponse = await serviceProvidersService.getTimeslotItems(1);
		expect(timeslotsScheduleResponse.timeslotItems[0]._weekDay).toBe(
			serviceMockWithTemplate.timeslotsSchedule.timeslotItems[0]._weekDay,
		);
	});

	it('should add timeslots schedule for service provider', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMockWithTemplate;
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
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
		ServicesServiceMock.getServiceTimeslotsSchedule = serviceMockWithTemplate.timeslotsSchedule;
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
		ServicesServiceMock.getServiceTimeslotsSchedule = serviceMockWithTemplate.timeslotsSchedule;

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
		ServicesServiceMock.getServiceTimeslotsSchedule = serviceMockWithTemplate.timeslotsSchedule;
		const serviceProvidersService = Container.get(ServiceProvidersService);
		await serviceProvidersService.deleteTimeslotItem(1, 4);
		expect(ServiceProvidersRepositoryMock.save).toBeCalledTimes(1);
		expect(TimeslotItemsServiceMock.deleteTimeslot).toBeCalledTimes(0);
	});

	it('should return only available service providers', async () => {
		TimeslotsServiceMock.getAggregatedTimeslots.mockImplementation(() => {
			const entry = new AvailableTimeslotProviders();
			entry.startTime = new Date(2020, 8, 26, 8, 0);
			entry.endTime = new Date(2020, 8, 26, 8, 30);

			const serviceProvider1 = ServiceProvider.create('Juku', 1);
			serviceProvider1.id = 1;
			const serviceProvider2 = ServiceProvider.create('Andi', 1);
			serviceProvider2.id = 2;

			const map = new Map<ServiceProvider, TimeslotWithCapacity>();
			map.set(serviceProvider1, createTimeslot(entry.startTime, entry.endTime, 1));
			map.set(serviceProvider2, createTimeslot(entry.startTime, entry.endTime, 1));

			entry.setRelatedServiceProviders(map);

			return Promise.resolve([entry]);
		});

		const serviceProvidersService = Container.get(ServiceProvidersService);
		const availableServiceProviders = await serviceProvidersService.getAvailableServiceProviders(
			new Date('2020-08-25T12:00'),
			new Date('2020-08-26T12:00'),
			1,
		);

		expect(availableServiceProviders).toHaveLength(2);
	});
});

class ServiceProvidersRepositoryMock extends ServiceProvidersRepository {
	public static sp: ServiceProvider;
	public static getServiceProvidersMock: ServiceProvider[];
	public static getServiceProviderMock: ServiceProvider;
	public static save = jest.fn();

	public async getServiceProviders(): Promise<ServiceProvider[]> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProvidersMock);
	}

	public async getServiceProvider(...params): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProviderMock);
	}

	public async save(listRequest: ServiceProviderModel): Promise<ServiceProvider> {
		return await ServiceProvidersRepositoryMock.save();
	}
}

class ScheduleFormsServiceMock extends ScheduleFormsService {
	public static updateScheduleFormInEntity = jest.fn();

	public async updateScheduleFormInEntity(...params): Promise<any> {
		return await ScheduleFormsServiceMock.updateScheduleFormInEntity(...params);
	}
}

class TimeslotsServiceMock extends TimeslotsService {
	public static getAggregatedTimeslots = jest.fn();

	public async getAggregatedTimeslots(...params): Promise<AvailableTimeslotProviders[]> {
		return await TimeslotsServiceMock.getAggregatedTimeslots(...params);
	}
}

class ServicesServiceMock extends ServicesService {
	public static getServiceTimeslotsSchedule: TimeslotsSchedule;
	public static serviceMock: Service = new Service();
	public static getServicesCalled = jest.fn();
	public async getServiceTimeslotsSchedule(): Promise<TimeslotsSchedule> {
		return Promise.resolve(ServicesServiceMock.getServiceTimeslotsSchedule);
	}
	public async getServices(): Promise<Service[]> {
		ServicesServiceMock.serviceMock.name = 'name';
		ServicesServiceMock.serviceMock.id = 1;
		ServicesServiceMock.getServicesCalled();
		return Promise.resolve([ServicesServiceMock.serviceMock]);
	}

	public async getService(id: number): Promise<Service> {
		return Promise.resolve(ServicesServiceMock.serviceMock);
	}
}

class TimeslotItemsServiceMock extends TimeslotItemsService {
	public static mapAndSaveTimeslotItemsToTimeslotsSchedule = jest.fn();
	public static deleteTimeslot = jest.fn();
	public static mapAndSaveTimeslotItem = jest.fn();
	public static createTimeslotItem = jest.fn();

	public async mapAndSaveTimeslotItem(
		timeslotsSchedule: TimeslotsSchedule,
		request: TimeslotItemRequest,
		entity: TimeslotItem,
	): Promise<TimeslotItem> {
		return await TimeslotItemsServiceMock.mapAndSaveTimeslotItem(timeslotsSchedule, request, entity);
	}

	public async deleteTimeslot(request: TimeslotItemsSearchRequest): Promise<DeleteResult> {
		return await TimeslotItemsServiceMock.deleteTimeslot({ id: request.id });
	}
	public async createTimeslotItem(...params): Promise<any> {
		return await TimeslotItemsServiceMock.createTimeslotItem(...params);
	}
}

class TimeslotsScheduleRepositoryMock extends TimeslotsScheduleRepository {
	public static getTimeslotsScheduleByIdMock = jest.fn();
	public static createTimeslotsScheduleMock: TimeslotsSchedule;

	public async getTimeslotsScheduleById(request: TimeslotItemsSearchRequest): Promise<TimeslotsSchedule> {
		return await TimeslotsScheduleRepositoryMock.getTimeslotsScheduleByIdMock({ id: request.id });
	}
	public async createTimeslotsSchedule(data: TimeslotsSchedule): Promise<TimeslotsSchedule> {
		return Promise.resolve(TimeslotsScheduleRepositoryMock.createTimeslotsScheduleMock);
	}
}

class OrganisationsRepositoryMock extends OrganisationsNoauthRepository {
	public static getOrganisationById = jest.fn();

	public async getOrganisationById(orgaId: number): Promise<Organisation> {
		return await OrganisationsRepositoryMock.getOrganisationById(orgaId);
	}
}
