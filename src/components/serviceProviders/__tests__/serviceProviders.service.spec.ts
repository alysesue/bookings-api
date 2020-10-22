import { Container } from 'typescript-ioc';
import { cloneDeep } from 'lodash';
import { DeleteResult } from 'typeorm';
import { ServiceProvidersService } from '../serviceProviders.service';
import { ServiceProvidersRepository } from '../serviceProviders.repository';
import {
	Calendar,
	ScheduleForm,
	Service,
	ServiceProvider,
	TimeOfDay,
	TimeslotItem,
	TimeslotsSchedule,
	User,
} from '../../../models';
import { ServiceProviderModel, SetProviderScheduleFormRequest } from '../serviceProviders.apicontract';
import { CalendarsService } from '../../calendars/calendars.service';
import { ScheduleFormsService } from '../../scheduleForms/scheduleForms.service';
import { TimeslotsScheduleRepository } from '../../timeslotsSchedules/timeslotsSchedule.repository';
import { TimeslotItemsService } from '../../timeslotItems/timeslotItems.service';
import { Weekday } from '../../../enums/weekday';
import { TimeslotItemRequest } from '../../timeslotItems/timeslotItems.apicontract';
import { ServicesService } from '../../services/services.service';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { AvailableTimeslotProviders } from '../../timeslots/availableTimeslotProviders';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { UserContextMock } from '../../bookings/__tests__/bookings.mocks';
import { ServiceAdminAuthGroup, ServiceProviderAuthGroup } from '../../../infrastructure/auth/authGroup';
import { TimeslotWithCapacity } from '../../../models/timeslotWithCapacity';
import { TimeslotServiceProvider } from '../../../models/timeslotServiceProvider';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

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

	const calendar = new Calendar();
	calendar.id = 1;
	calendar.uuid = '123';
	calendar.googleCalendarId = 'google-id-1';

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
		Container.bind(CalendarsService).to(CalendarsServiceMock);
		Container.bind(ScheduleFormsService).to(SchedulesServiceMock);
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(UserContext).to(UserContextMock);
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

	it('should save a service provider', async () => {
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [serviceMockWithTemplate])]),
		);
		CalendarsServiceMock.createCalendar = new Calendar();
		ServiceProvidersRepositoryMock.save.mockImplementation(() => serviceProviderMock);
		await Container.get(ServiceProvidersService).saveServiceProviders([serviceProviderMock], 1);
		expect(ServiceProvidersRepositoryMock.save).toBeCalled();
	});

	it('should set provider schedule', async () => {
		UserContextMock.getAuthGroups.mockReturnValue(
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [serviceMockWithTemplate])]),
		);
		const service = new Service();
		service.id = 1;
		const serviceProviderData = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');
		serviceProviderData.service = service;
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderData;
		ScheduleFormsServiceObj.getScheduleForm.mockImplementation(() => Promise.resolve(new ScheduleForm()));

		const providerSchedulerequest = new SetProviderScheduleFormRequest();
		providerSchedulerequest.scheduleFormId = 2;
		const schedule = await Container.get(ServiceProvidersService).setProviderScheduleForm(
			1,
			providerSchedulerequest,
		);

		expect(schedule).toBeDefined();
		expect(serviceProviderData.scheduleForm).toBe(schedule);
	});

	it('should update a service provider', async () => {
		const service = new Service();
		service.id = 1;
		serviceProviderMock.service = service;
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		ServiceProvidersRepositoryMock.save.mockImplementation(() => serviceProviderMock);
		UserContextMock.getAuthGroups.mockReturnValue(
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);
		await Container.get(ServiceProvidersService).updateSp(serviceProviderMock, 1);
		expect(ServiceProvidersRepositoryMock.save).toBeCalled();
	});

	it('should set provider schedule to null', async () => {
		const service = new Service();
		service.id = 1;
		UserContextMock.getAuthGroups.mockReturnValue(
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);
		serviceProviderMock.serviceId = 1;
		serviceProviderMock.service = service;
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		ScheduleFormsServiceObj.getScheduleForm.mockImplementation(() => Promise.resolve());

		const providerScheduleRequest = new SetProviderScheduleFormRequest();
		providerScheduleRequest.scheduleFormId = null;
		const scheduleForm = await Container.get(ServiceProvidersService).setProviderScheduleForm(
			1,
			providerScheduleRequest,
		);

		expect(scheduleForm).toBe(null);
		expect(serviceProviderMock.scheduleForm).toBe(null);
		expect(ScheduleFormsServiceObj.getScheduleForm).not.toBeCalled();
	});

	it('should get provider schedule', async () => {
		serviceProviderMock.scheduleForm = new ScheduleForm();
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;

		const schedule = await Container.get(ServiceProvidersService).getProviderScheduleForm(1);
		expect(schedule).toBeDefined();
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

	it('should copy timeslots schedule item for service to  service provider and update', async () => {
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
			const serviceProvider2 = ServiceProvider.create('Andi', 1);
			const sptimeslot1 = new TimeslotServiceProvider(serviceProvider1, 1);
			const sptimeslot2 = new TimeslotServiceProvider(serviceProvider2, 1);
			entry.timeslotServiceProviders.set(1, sptimeslot1);
			entry.timeslotServiceProviders.set(2, sptimeslot2);

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

class CalendarsServiceMock extends CalendarsService {
	public static createCalendar: Calendar;

	public async createCalendar(): Promise<Calendar> {
		return Promise.resolve(CalendarsServiceMock.createCalendar);
	}
}

const ScheduleFormsServiceObj = {
	getScheduleForm: jest.fn(),
};

class SchedulesServiceMock extends ScheduleFormsService {
	public async getScheduleForm(id: number): Promise<ScheduleForm> {
		return ScheduleFormsServiceObj.getScheduleForm(id);
	}
}

class TimeslotsServiceMock extends TimeslotsService {
	public static getAggregatedTimeslots = jest.fn();

	public async getAggregatedTimeslots(...params): Promise<AvailableTimeslotProviders[]> {
		return Promise.resolve(TimeslotsServiceMock.getAggregatedTimeslots(...params));
	}
}

class ServicesServiceMock extends ServicesService {
	public static getServiceTimeslotsSchedule: TimeslotsSchedule;
	public static serviceMock: Service = new Service();
	public async getServiceTimeslotsSchedule(): Promise<TimeslotsSchedule> {
		return Promise.resolve(ServicesServiceMock.getServiceTimeslotsSchedule);
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

	public async deleteTimeslot(timeslotId: number): Promise<DeleteResult> {
		return await TimeslotItemsServiceMock.deleteTimeslot(timeslotId);
	}
	public async createTimeslotItem(...params): Promise<any> {
		return await TimeslotItemsServiceMock.createTimeslotItem(...params);
	}
}

class TimeslotsScheduleRepositoryMock extends TimeslotsScheduleRepository {
	public static getTimeslotsScheduleByIdMock = jest.fn();
	public static createTimeslotsScheduleMock: TimeslotsSchedule;

	public async getTimeslotsScheduleById(id: number): Promise<TimeslotsSchedule> {
		return await TimeslotsScheduleRepositoryMock.getTimeslotsScheduleByIdMock(id);
	}

	public async createTimeslotsSchedule(data: TimeslotsSchedule): Promise<TimeslotsSchedule> {
		return Promise.resolve(TimeslotsScheduleRepositoryMock.createTimeslotsScheduleMock);
	}
}
