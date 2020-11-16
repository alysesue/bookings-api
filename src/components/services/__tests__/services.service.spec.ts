import { DeleteResult } from 'typeorm';
import { Container } from 'typescript-ioc';
import { ServicesService } from '../services.service';
import { ServiceRequest } from '../service.apicontract';
import { Organisation, ScheduleForm, Service, TimeOfDay, TimeslotItem, TimeslotsSchedule, User } from '../../../models';
import { ServicesRepository } from '../services.repository';
import { ScheduleFormsService } from '../../scheduleForms/scheduleForms.service';
import { TimeslotsScheduleService } from '../../timeslotsSchedules/timeslotsSchedule.service';
import { TimeslotItemsService } from '../../timeslotItems/timeslotItems.service';
import { TimeslotItemRequest } from '../../timeslotItems/timeslotItems.apicontract';
import { Weekday } from '../../../enums/weekday';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { AuthGroup, OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { ServicesActionAuthVisitor } from '../services.auth';
import { TimeslotItemsSearchRequest } from '../../timeslotItems/timeslotItems.repository';
import { ScheduleFormRequest } from '../../scheduleForms/scheduleForms.apicontract';

jest.mock('../services.auth');

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const timeslotItemRequest = new TimeslotItemRequest();
const serviceMockWithTemplate = new Service();
const timeslotsScheduleMock = new TimeslotsSchedule();
const timeslotItemMock = TimeslotItem.create(
	1,
	Weekday.Monday,
	TimeOfDay.create({
		hours: 11,
		minutes: 0,
	}),
	TimeOfDay.create({ hours: 11, minutes: 30 }),
);

const visitorObject = {
	hasPermission: jest.fn(),
};

beforeAll(() => {
	Container.bind(ServicesRepository).to(ServicesRepositoryMockClass);
	Container.bind(ScheduleFormsService).to(ScheduleFormsServiceMock);
	Container.bind(TimeslotsScheduleService).to(TimeslotsScheduleMockClass);
	Container.bind(TimeslotItemsService).to(TimeslotItemsServiceMock);
	Container.bind(UserContext).to(UserContextMock);
});

beforeEach(() => {
	jest.resetAllMocks();
	timeslotItemRequest.weekDay = 0;
	timeslotItemRequest.startTime = '9:00';
	timeslotItemRequest.endTime = '10:00';
	serviceMockWithTemplate.id = 1;
	serviceMockWithTemplate.organisationId = 1;
	serviceMockWithTemplate.name = 'John';
	timeslotItemMock._id = 4;
	timeslotsScheduleMock._id = 1;
	timeslotsScheduleMock.timeslotItems = [timeslotItemMock];
	serviceMockWithTemplate.timeslotsSchedule = timeslotsScheduleMock;
	visitorObject.hasPermission.mockReturnValue(true);
	(ServicesActionAuthVisitor as jest.Mock).mockImplementation(() => visitorObject);
	UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));
	UserContextMock.getAuthGroups.mockImplementation(() =>
		Promise.resolve([new OrganisationAdminAuthGroup(userMock, [organisation])]),
	);
});

const userMock = User.createAdminUser({
	molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
	userName: 'UserName',
	email: 'test@email.com',
	name: 'Name',
});

const organisation = new Organisation();
organisation.id = 1;

describe('Services service tests', () => {
	it('should save service', async () => {
		const request = new ServiceRequest();
		request.name = 'John';
		request.organisationId = 1;

		await Container.get(ServicesService).createService(request);
		expect(ServicesRepositoryMockClass.save.mock.calls[0][0].name).toBe('John');
	});

	it('should update service', async () => {
		const newService = new Service();
		newService.id = 1;
		newService.organisationId = 1;
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(newService));
		const request = new ServiceRequest();
		request.name = 'John';
		request.organisationId = 1;

		await Container.get(ServicesService).updateService(1, request);
		expect(ServicesRepositoryMockClass.save.mock.calls[0][0].name).toBe('John');
	});

	it('should throw if service not found', async () => {
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(undefined));
		const request = new ServiceRequest();
		request.name = 'John';

		await expect(async () => await Container.get(ServicesService).updateService(1, request)).rejects.toThrowError();
	});

	it('should set service scheduleForm', async () => {
		const newService = new Service();
		newService.organisationId = 1;
		newService.id = 1;
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(newService));

		ScheduleFormsServiceMock.updateScheduleFormInEntity.mockImplementation(() => {
			newService.scheduleForm = new ScheduleForm();
			return Promise.resolve(newService);
		});

		const request = new ScheduleFormRequest();
		await Container.get(ServicesService).setServiceScheduleForm(1, request);

		expect(newService.scheduleForm).toBeDefined();
		expect(ScheduleFormsServiceMock.updateScheduleFormInEntity).toBeCalled();
	});

	it('should get service scheduleForm', async () => {
		const newService = new Service();
		newService.scheduleFormId = 2;
		newService.scheduleForm = new ScheduleForm();
		newService.scheduleForm.id = 2;

		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(newService));

		const schedule = await Container.get(ServicesService).getServiceScheduleForm(1);
		expect(schedule).toBeDefined();
	});

	it('should throw service not found', async () => {
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(null));
		ScheduleFormsServiceMock.updateScheduleFormInEntity.mockImplementation(() => Promise.resolve());

		await expect(async () => {
			const request = new ScheduleFormRequest();
			await Container.get(ServicesService).setServiceScheduleForm(1, request);
		}).rejects.toThrowError();

		await expect(async () => {
			await Container.get(ServicesService).getServiceScheduleForm(1);
		}).rejects.toThrowError();
	});

	it('should return TimeslotsSchedule', async () => {
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));

		const data = await Container.get(ServicesService).getServiceTimeslotsSchedule(1);
		expect(ServicesRepositoryMockClass.getService).toBeCalledTimes(1);
		expect(data).toBe(serviceMockWithTemplate.timeslotsSchedule);
	});

	it('should add timeslotItem', async () => {
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));

		TimeslotItemsServiceMock.createTimeslotItem.mockImplementation(() => Promise.resolve());
		await Container.get(ServicesService).addTimeslotItem(1, timeslotItemRequest);
		expect(ServicesRepositoryMockClass.getService).toBeCalledTimes(1);
		expect(TimeslotItemsServiceMock.createTimeslotItem).toBeCalledTimes(1);
	});

	it(`should create timeslots schedule if it doesn't exist`, async () => {
		const service = new Service();
		service.id = 1;
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(service));

		TimeslotItemsServiceMock.createTimeslotItem.mockImplementation(() => Promise.resolve());
		await Container.get(ServicesService).addTimeslotItem(1, timeslotItemRequest);

		expect(ServicesRepositoryMockClass.getService).toBeCalledTimes(1);
		expect(TimeslotItemsServiceMock.createTimeslotItem).toBeCalledTimes(1);
		expect(ServicesRepositoryMockClass.save).toBeCalledTimes(1);
	});

	it('should delete timeslotItem', async () => {
		await Container.get(ServicesService).deleteTimeslotsScheduleItem(1);
		expect(TimeslotItemsServiceMock.deleteTimeslot).toBeCalledTimes(1);
	});

	it('should update timeslotItem', async () => {
		ServicesRepositoryMockClass.getService.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));
		TimeslotsScheduleMockClass.getTimeslotsScheduleById.mockImplementation(() =>
			Promise.resolve(serviceMockWithTemplate.timeslotsSchedule),
		);
		await Container.get(ServicesService).updateTimeslotItem({
			serviceId: 1,
			timeslotId: 4,
			request: timeslotItemRequest,
		});
		expect(TimeslotItemsServiceMock.updateTimeslotItem).toBeCalledTimes(1);
	});

	it('should throw Service name is empty', async () => {
		const request = new ServiceRequest();
		request.name = '   ';
		await expect(async () => await Container.get(ServicesService).createService(request)).rejects.toThrowError();
	});

	it('should get first authorised organisation', () => {
		const orgAdmins = [new OrganisationAdminAuthGroup(userMock, [organisation])];

		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve(orgAdmins));

		expect(orgAdmins[0] instanceof OrganisationAdminAuthGroup).toBe(true);
	});

	it('should not get first authorised organisation', () => {
		const orgAdmins = [];

		UserContextMock.getAuthGroups.mockImplementation(() => Promise.resolve(orgAdmins));

		expect(orgAdmins[0] instanceof OrganisationAdminAuthGroup).toBe(false);
	});
});

class ServicesRepositoryMockClass extends ServicesRepository {
	public static save = jest.fn();
	public static getService = jest.fn();
	public static get = jest.fn();
	public static getAll = jest.fn();

	public async save(service: Service): Promise<Service> {
		return ServicesRepositoryMockClass.save(service);
	}

	public async get(id: number): Promise<Service> {
		return ServicesRepositoryMockClass.get(id);
	}

	public async getAll(): Promise<Service[]> {
		return ServicesRepositoryMockClass.getAll();
	}

	public async getService(): Promise<Service> {
		return ServicesRepositoryMockClass.getService();
	}
}

class ScheduleFormsServiceMock extends ScheduleFormsService {
	public static updateScheduleFormInEntity = jest.fn();

	public async updateScheduleFormInEntity(...params): Promise<any> {
		return await ScheduleFormsServiceMock.updateScheduleFormInEntity(...params);
	}
}
class TimeslotItemsServiceMock extends TimeslotItemsService {
	public static mapAndSaveTimeslotItemsToTimeslotsSchedule = jest.fn();
	public static deleteTimeslot = jest.fn();
	public static mapAndSaveTimeslotItem = jest.fn();
	public static createTimeslotItem = jest.fn();
	public static updateTimeslotItem = jest.fn();

	public async mapAndSaveTimeslotItem(
		timeslotsSchedule: TimeslotsSchedule,
		request: TimeslotItemRequest,
		entity: TimeslotItem,
	): Promise<TimeslotItem> {
		return await TimeslotItemsServiceMock.mapAndSaveTimeslotItem(timeslotsSchedule, request, entity);
	}

	public async createTimeslotItem(
		timeslotsSchedule: TimeslotsSchedule,
		request: TimeslotItemRequest,
	): Promise<TimeslotItem> {
		return await TimeslotItemsServiceMock.createTimeslotItem(timeslotsSchedule, request);
	}

	public async deleteTimeslot(request: TimeslotItemsSearchRequest): Promise<DeleteResult> {
		return await TimeslotItemsServiceMock.deleteTimeslot({ id: request.id });
	}

	public async updateTimeslotItem(
		timeslotsSchedule: TimeslotsSchedule,
		timeslotId: number,
		request: TimeslotItemRequest,
	): Promise<TimeslotItem> {
		return await TimeslotItemsServiceMock.updateTimeslotItem(timeslotsSchedule, timeslotId, request);
	}
}

class TimeslotsScheduleMockClass extends TimeslotItemsService {
	public static getTimeslotsScheduleById = jest.fn();

	public async getTimeslotsScheduleById(id: number): Promise<TimeslotsSchedule> {
		return await TimeslotsScheduleMockClass.getTimeslotsScheduleById(id);
	}
}

class UserContextMock extends UserContext {
	public static getCurrentUser = jest.fn<Promise<User>, any>();
	public static getAuthGroups = jest.fn<Promise<AuthGroup[]>, any>();

	public init() {}
	public async getCurrentUser(...params): Promise<any> {
		return await UserContextMock.getCurrentUser(...params);
	}

	public async getAuthGroups(...params): Promise<any> {
		return await UserContextMock.getAuthGroups(...params);
	}
}
