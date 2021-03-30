import { DeleteResult } from 'typeorm';
import { Container } from 'typescript-ioc';
import { ServicesService } from '../services.service';
import { ServiceRequest } from '../service.apicontract';
import {
	Label,
	Organisation,
	OrganisationAdminGroupMap,
	ScheduleForm,
	Service,
	TimeOfDay,
	TimeslotItem,
	TimeslotsSchedule,
	User,
} from '../../../models';
import { ServicesRepository } from '../services.repository';
import { ScheduleFormsService } from '../../scheduleForms/scheduleForms.service';
import { TimeslotsScheduleService } from '../../timeslotsSchedules/timeslotsSchedule.service';
import { TimeslotItemsService } from '../../timeslotItems/timeslotItems.service';
import { TimeslotItemRequest } from '../../timeslotItems/timeslotItems.apicontract';
import { Weekday } from '../../../enums/weekday';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { ServicesActionAuthVisitor } from '../services.auth';
import { TimeslotItemsSearchRequest } from '../../timeslotItems/timeslotItems.repository';
import { ScheduleFormRequest } from '../../scheduleForms/scheduleForms.apicontract';
import { OrganisationsNoauthRepository } from '../../organisations/organisations.noauth.repository';
import { MolUsersService } from '../../users/molUsers/molUsers.service';
import {
	IMolCognitoUserResponse,
	MolServiceAdminUserContract,
	MolUpsertUsersResult,
} from '../../users/molUsers/molUsers.apicontract';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { UsersServiceMock } from '../../users/__mocks__/users.service';
import { UsersService } from '../../users/users.service';

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
	Container.bind(ServicesRepository).to(ServicesRepositoryMock);
	Container.bind(ScheduleFormsService).to(ScheduleFormsServiceMock);
	Container.bind(TimeslotsScheduleService).to(TimeslotsScheduleMockClass);
	Container.bind(TimeslotItemsService).to(TimeslotItemsServiceMock);
	Container.bind(MolUsersService).to(MolUsersServiceMock);
	Container.bind(UserContext).to(UserContextMock);
	Container.bind(UsersService).to(UsersServiceMock);
	Container.bind(OrganisationsNoauthRepository).to(OrganisationsRepositoryMock);
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
organisation._organisationAdminGroupMap = { organisationRef: 'orga', organisationId: 1 } as OrganisationAdminGroupMap;

describe('Services service tests', () => {
	it('should create admin service and service', async () => {
		const admin = {
			name: 'name',
			email: 'email',
			phoneNumber: 'phoneNumber',
			serviceNames: ['service1'],
		} as MolServiceAdminUserContract;

		const molUser = {
			...admin,
			sub: 'd080f6ed-3b47-478a-a6c6-dfb5608a198d',
			username: 'username',
			groups: ['bookingsg:svc-admin-service1:orga'],
		} as IMolCognitoUserResponse;

		MolUsersServiceMock.molUpsertUser.mockImplementation(() => Promise.resolve({ created: [molUser] }));
		UserContextMock.getFirstAuthorisedOrganisation.mockReturnValue(Promise.resolve(organisation));

		ServicesRepositoryMock.getServicesByName.mockReturnValue(Promise.resolve([]));
		ServicesRepositoryMock.saveMany.mockReturnValue(Promise.resolve([]));

		await Container.get(ServicesService).createServicesAdmins([admin], 'token');
		expect(MolUsersServiceMock.molUpsertUser).toBeCalled();
		expect(ServicesRepositoryMock.getServicesByName).toBeCalled();
		expect(ServicesRepositoryMock.saveMany).toBeCalled();
	});

	it('should save service', async () => {
		const request = new ServiceRequest();
		request.name = 'John';
		request.organisationId = 1;
		OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(
			Promise.resolve({ _organisationAdminGroupMap: { organisationRef: 'orga' } }),
		);
		request.labels = [{ label: 'label' }];

		await Container.get(ServicesService).createService(request);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].name).toBe('John');
		expect(ServicesRepositoryMock.save.mock.calls[0][0].labels).toHaveLength(1);
	});

	it('should update service', async () => {
		const newService = new Service();
		newService.id = 1;
		newService.organisationId = 1;
		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(newService));
		const request = new ServiceRequest();
		request.name = 'John';
		request.organisationId = 1;

		await Container.get(ServicesService).updateService(1, request);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].name).toBe('John');
		expect(ServicesRepositoryMock.save.mock.calls[0][0].labels).toHaveLength(0);
	});

	it('should throw if service not found', async () => {
		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(undefined));
		const request = new ServiceRequest();
		request.name = 'John';

		await expect(async () => await Container.get(ServicesService).updateService(1, request)).rejects.toThrowError();
	});

	it('should set service scheduleForm', async () => {
		const newService = new Service();
		newService.organisationId = 1;
		newService.id = 1;
		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(newService));

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

		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(newService));

		const schedule = await Container.get(ServicesService).getServiceScheduleForm(1);
		expect(schedule).toBeDefined();
	});

	it('should throw service not found', async () => {
		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(null));
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
		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));

		const data = await Container.get(ServicesService).getServiceTimeslotsSchedule(1);
		expect(ServicesRepositoryMock.getService).toBeCalledTimes(1);
		expect(data).toBe(serviceMockWithTemplate.timeslotsSchedule);
	});

	it('should add timeslotItem', async () => {
		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));

		TimeslotItemsServiceMock.createTimeslotItem.mockImplementation(() => Promise.resolve());
		await Container.get(ServicesService).addTimeslotItem(1, timeslotItemRequest);
		expect(ServicesRepositoryMock.getService).toBeCalledTimes(1);
		expect(TimeslotItemsServiceMock.createTimeslotItem).toBeCalledTimes(1);
	});

	it(`should create timeslots schedule if it doesn't exist`, async () => {
		const service = new Service();
		service.id = 1;
		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(service));

		TimeslotItemsServiceMock.createTimeslotItem.mockImplementation(() => Promise.resolve());
		await Container.get(ServicesService).addTimeslotItem(1, timeslotItemRequest);

		expect(ServicesRepositoryMock.getService).toBeCalledTimes(1);
		expect(TimeslotItemsServiceMock.createTimeslotItem).toBeCalledTimes(1);
		expect(ServicesRepositoryMock.save).toBeCalledTimes(1);
	});

	it('should delete timeslotItem', async () => {
		await Container.get(ServicesService).deleteTimeslotsScheduleItem(1);
		expect(TimeslotItemsServiceMock.deleteTimeslot).toBeCalledTimes(1);
	});

	it('should update timeslotItem', async () => {
		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));
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

	it('should create labels', async () => {
		const request = new ServiceRequest();
		request.name = 'John';
		request.organisationId = 1;
		OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(
			Promise.resolve({ _organisationAdminGroupMap: { organisationRef: 'orga' } }),
		);
		request.labels = [{ label: 'Chinese' }, { label: 'Chinese' }];

		await Container.get(ServicesService).createService(request);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].name).toBe('John');
		expect(ServicesRepositoryMock.save.mock.calls[0][0].labels).toHaveLength(1);
	});

	it('should update labels', async () => {
		const newService = new Service();
		newService.id = 1;
		newService.organisationId = 1;
		newService.name = 'John';
		const labels: Label[] = [Label.create('Chinese'), Label.create('English')];
		newService.labels = labels;

		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(newService));
		const request = new ServiceRequest();
		request.labels = [{ label: 'Tamil' }];

		await Container.get(ServicesService).updateService(1, request);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].labels).toHaveLength(1);
	});

	it('should not update labels', async () => {
		const newService = new Service();
		newService.id = 1;
		newService.organisationId = 1;
		newService.name = 'John';
		const labels: Label[] = [Label.create('Chinese'), Label.create('English')];
		newService.labels = labels;

		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(newService));
		const request = new ServiceRequest();
		request.labels = [{ label: 'Chinese' }];

		// Not working, need to review
		await expect(async () => await Container.get(ServicesService).updateService(1, request)).rejects.toThrowError();
	});
});

class ServicesRepositoryMock implements Partial<ServicesRepository> {
	public static save = jest.fn();
	public static getService = jest.fn();
	public static get = jest.fn();
	public static getAll = jest.fn();
	public static getServicesByName = jest.fn();
	public static saveMany = jest.fn();

	public async getServicesByName(...params): Promise<Service[]> {
		return ServicesRepositoryMock.getServicesByName(...params);
	}

	public async save(service: Service): Promise<Service> {
		return ServicesRepositoryMock.save(service);
	}

	public async get(id: number): Promise<Service> {
		return ServicesRepositoryMock.get(id);
	}

	public async getAll(): Promise<Service[]> {
		return ServicesRepositoryMock.getAll();
	}

	public async getService(): Promise<Service> {
		return ServicesRepositoryMock.getService();
	}

	public async saveMany(...params): Promise<Service[]> {
		return ServicesRepositoryMock.saveMany(...params);
	}
}

class ScheduleFormsServiceMock implements Partial<ScheduleFormsService> {
	public static updateScheduleFormInEntity = jest.fn();

	public async updateScheduleFormInEntity(...params): Promise<any> {
		return await ScheduleFormsServiceMock.updateScheduleFormInEntity(...params);
	}
}

class TimeslotItemsServiceMock implements Partial<TimeslotItemsService> {
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

class TimeslotsScheduleMockClass implements Partial<TimeslotsScheduleService> {
	public static getTimeslotsScheduleById = jest.fn();

	public async getTimeslotsScheduleById(id: number): Promise<TimeslotsSchedule> {
		return await TimeslotsScheduleMockClass.getTimeslotsScheduleById(id);
	}
}

class MolUsersServiceMock implements Partial<MolUsersService> {
	public static molUpsertUser = jest.fn();

	public async molUpsertUser(...args): Promise<MolUpsertUsersResult> {
		return await MolUsersServiceMock.molUpsertUser(...args);
	}
}

class OrganisationsRepositoryMock implements Partial<OrganisationsNoauthRepository> {
	public static getOrganisationById = jest.fn();

	public async getOrganisationById(orgaId: number): Promise<Organisation> {
		return await OrganisationsRepositoryMock.getOrganisationById(orgaId);
	}
}
