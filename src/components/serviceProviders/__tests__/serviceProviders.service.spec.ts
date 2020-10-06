import { Container } from 'typescript-ioc';
import { cloneDeep } from 'lodash';
import { DeleteResult } from 'typeorm';
import { ServiceProvidersService } from '../serviceProviders.service';
import { ServiceProvidersRepository } from '../serviceProviders.repository';
import {
	Calendar,
	Schedule,
	Service,
	ServiceProvider,
	TimeOfDay,
	TimeslotItem,
	TimeslotsSchedule,
	User,
	ChangeLogAction,
} from '../../../models';
import { ServiceProviderModel, SetProviderScheduleRequest } from '../serviceProviders.apicontract';
import { CalendarsService } from '../../calendars/calendars.service';
import { SchedulesService } from '../../schedules/schedules.service';
import { TimeslotsScheduleRepository } from '../../timeslotsSchedules/timeslotsSchedule.repository';
import { TimeslotItemsService } from '../../timeslotItems/timeslotItems.service';
import { Weekday } from '../../../enums/weekday';
import { TimeslotItemRequest } from '../../timeslotItems/timeslotItems.apicontract';
import { ServicesService } from '../../services/services.service';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { AvailableTimeslotProviders } from '../../timeslots/availableTimeslotProviders';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { AuthGroup, ServiceProviderAuthGroup, IAuthGroupVisitor } from '../../../infrastructure/auth/authGroup';
import { TimeslotItemsActionAuthVisitor } from '../../timeslotItems/timeslotItems.auth';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

// tslint:disable-next-line:no-big-function
describe('ServiceProviders.Service', () => {
	const serviceProviderMock = new ServiceProvider();
	const serviceProviderMockWithTemplate = new ServiceProvider();
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

	const serviceProvider = new ServiceProvider();
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
		Container.bind(SchedulesService).to(SchedulesServiceMock);
		Container.bind(TimeslotsService).to(TimeslotsServiceMock);
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(TimeslotItemsActionAuthVisitor).to(TimeslotItemsActionAuthVisitorMock);


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
		serviceProviderMockWithTemplate.name = 'service';
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
		CalendarsServiceMock.createCalendar = new Calendar();
		ServiceProvidersRepositoryMock.save.mockImplementation(() => serviceProviderMock);
		await Container.get(ServiceProvidersService).saveServiceProviders([serviceProviderMock], 1);
		expect(ServiceProvidersRepositoryMock.save).toBeCalled();
	});

	it('should set provider schedule', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		SchedulesServiceObj.getSchedule.mockImplementation(() => Promise.resolve(new Schedule()));

		const providerSchedulerequest = new SetProviderScheduleRequest();
		providerSchedulerequest.scheduleId = 2;
		const schedule = await Container.get(ServiceProvidersService).setProviderSchedule(1, providerSchedulerequest);

		expect(schedule).toBeDefined();
		expect(serviceProviderMock.schedule).toBe(schedule);
	});

	it('should update a service provider', async () => {
		ServiceProvidersRepositoryMock.save.mockImplementation(() => serviceProviderMock);
		await Container.get(ServiceProvidersService).updateSp(serviceProviderMock, 1);
		expect(ServiceProvidersRepositoryMock.save).toBeCalled();
	});

	it('should set provider schedule to null', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		SchedulesServiceObj.getSchedule.mockImplementation(() => Promise.resolve());

		const providerSchedulerequest = new SetProviderScheduleRequest();
		providerSchedulerequest.scheduleId = null;
		const schedule = await Container.get(ServiceProvidersService).setProviderSchedule(1, providerSchedulerequest);

		expect(schedule).toBe(null);
		expect(serviceProviderMock.schedule).toBe(null);
		expect(SchedulesServiceObj.getSchedule).not.toBeCalled();
	});

	it('should get provider schedule', async () => {
		serviceProviderMock.schedule = new Schedule();
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;

		const schedule = await Container.get(ServiceProvidersService).getProviderSchedule(1);
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
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new ServiceProviderAuthGroup(adminMock, serviceProvider)]));

		new TimeslotItemsActionAuthVisitorMock(timeslotsScheduleMock);

		const serviceProvidersService = Container.get(ServiceProvidersService);
		await serviceProvidersService.addTimeslotItem(1, request);
		expect(ServiceProvidersRepositoryMock.save).toBeCalledTimes(0);
		expect(TimeslotItemsServiceMock.mapAndSaveTimeslotItem).toBeCalledTimes(1);
	});

	it('should copy timeslots item  service to  service provider and save it', async () => {
		ServiceProvidersRepositoryMock.getServiceProviderMock = serviceProviderMock;
		ServicesServiceMock.getServiceTimeslotsSchedule = serviceMockWithTemplate.timeslotsSchedule;
		ServiceProvidersRepositoryMock.save.mockImplementation(() => serviceProviderMockWithTemplate);


		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(singpassMock));
		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve([new ServiceProviderAuthGroup(adminMock, serviceProviderMockWithTemplate)]));

		const serviceProvidersService = Container.get(ServiceProvidersService);
		await serviceProvidersService.addTimeslotItem(1, request);
		expect(ServiceProvidersRepositoryMock.save).toBeCalledTimes(1);
		expect(TimeslotItemsServiceMock.mapAndSaveTimeslotItem).toBeCalledTimes(1);
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
		const timeslot: AvailableTimeslotProviders = {} as AvailableTimeslotProviders;

		timeslot.availableServiceProviders = [
			({
				_id: 1,
				_name: 'Test',
			} as unknown) as ServiceProvider,
			({
				_id: 2,
				_name: 'Test2',
			} as unknown) as ServiceProvider,
		];
		TimeslotsServiceMock.timeslotProviders = [timeslot];

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

const SchedulesServiceObj = {
	getSchedule: jest.fn(),
};

class SchedulesServiceMock extends SchedulesService {
	public async getSchedule(id: number): Promise<Schedule> {
		return SchedulesServiceObj.getSchedule(id);
	}
}

class TimeslotsServiceMock extends TimeslotsService {
	public static timeslotProviders: AvailableTimeslotProviders[];

	public async getAggregatedTimeslots(
		startDateTime: Date,
		endDateTime: Date,
		serviceId: number,
		includeBookings: boolean = false,
		serviceProviderId?: number,
	): Promise<AvailableTimeslotProviders[]> {
		return Promise.resolve(TimeslotsServiceMock.timeslotProviders);
	}
}

class ServicesServiceMock extends ServicesService {
	public static getServiceTimeslotsSchedule: TimeslotsSchedule;

	public async getServiceTimeslotsSchedule(): Promise<TimeslotsSchedule> {
		return Promise.resolve(ServicesServiceMock.getServiceTimeslotsSchedule);
	}
}

class TimeslotItemsServiceMock extends TimeslotItemsService {
	public static mapAndSaveTimeslotItemsToTimeslotsSchedule = jest.fn();
	public static deleteTimeslot = jest.fn();
	public static mapAndSaveTimeslotItem = jest.fn();

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

export class UserContextMock extends UserContext {
	public static getCurrentUser = jest.fn<Promise<User>, any>();
	public static getAuthGroups = jest.fn<Promise<AuthGroup[]>, any>();

	public init() { }
	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(...params);
	}

	public async getAuthGroups(...params): Promise<any> {
		return await UserContextMock.getAuthGroups(...params);
	}
}

class TimeslotItemsActionAuthVisitorMock extends TimeslotItemsActionAuthVisitor {
	public static hasPermission = jest.fn();
	public hasPermission(...params): any {
		return TimeslotItemsActionAuthVisitorMock.hasPermission(...params);
	}
}
