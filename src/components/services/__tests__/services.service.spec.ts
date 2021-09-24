import { Container } from 'typescript-ioc';
import { ServicesService } from '../services.service';
import { ServiceRequestV1 } from '../service.apicontract';
import {
	Label,
	Organisation,
	OrganisationAdminGroupMap,
	ScheduleForm,
	Service,
	ServiceAdminGroupMap,
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
import { ContainerContextHolder } from '../../../infrastructure/containerContext';
import { LabelsCategoriesService } from '../../labelsCategories/labelsCategories.service';
import { LabelsCategoriesServiceMock } from '../../labelsCategories/__mocks__/labelsCategories.service.mock';
import { AsyncFunction, TransactionManager } from '../../../core/transactionManager';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { ServicesRepositoryMock } from '../__mocks__/services.repository.mock';
import { TimeslotItemsServiceMock } from '../../timeslotItems/__mocks__/timeslotItems.service.mock';
import { ScheduleFormsServiceMock } from '../../scheduleForms/__mocks__/scheduleForms.service.mock';
import { OrganisationsRepositoryMock } from '../../organisations/__mocks__/organisations.noauth.repository.mock';

jest.mock('../services.auth');
jest.mock('../services.repository', () => {
	class ServicesRepository {}
	return { ServicesRepository };
});

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const organisation = new Organisation();
organisation.id = 1;
organisation._organisationAdminGroupMap = { organisationRef: 'orga', organisationId: 1 } as OrganisationAdminGroupMap;

const timeslotItemRequest = new TimeslotItemRequest();
const serviceMockWithTemplate = Service.create('serviceMockWithTemplate', organisation);
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
	ContainerContextHolder.registerInContainer();
	Container.bind(ServicesRepository).to(ServicesRepositoryMock);
	Container.bind(ScheduleFormsService).to(ScheduleFormsServiceMock);
	Container.bind(TimeslotsScheduleService).to(TimeslotsScheduleMockClass);
	Container.bind(TimeslotItemsService).to(TimeslotItemsServiceMock);
	Container.bind(MolUsersService).to(MolUsersServiceMock);
	Container.bind(UserContext).to(UserContextMock);
	Container.bind(UsersService).to(UsersServiceMock);
	Container.bind(OrganisationsNoauthRepository).to(OrganisationsRepositoryMock);
	Container.bind(LabelsCategoriesService).to(LabelsCategoriesServiceMock);
	Container.bind(TransactionManager).to(TransactionManagerMock);
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
	TransactionManagerMock.runInTransaction.mockImplementation(
		async <T extends unknown>(_isolationLevel: IsolationLevel, asyncFunction: AsyncFunction<T>): Promise<T> =>
			await asyncFunction(),
	);

	let saved: Service;
	ServicesRepositoryMock.save.mockImplementation(async (s: Service) => {
		saved = s;
		s.id = 2;
		return s;
	});
	ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(saved));
});

const userMock = User.createAdminUser({
	molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
	userName: 'UserName',
	email: 'test@email.com',
	name: 'Name',
});

// tslint:disable-next-line:no-big-function
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

	it('should create admin service and service (without replacing service reference)', async () => {
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

		const service = Service.create('service1', organisation);
		service.id = 1;
		service.serviceAdminGroupMap = ServiceAdminGroupMap.create('service-abc:orga');

		MolUsersServiceMock.molUpsertUser.mockImplementation(() => Promise.resolve({ created: [molUser] }));
		UserContextMock.getFirstAuthorisedOrganisation.mockReturnValue(Promise.resolve(organisation));

		ServicesRepositoryMock.getServicesByName.mockReturnValue(Promise.resolve([service]));
		ServicesRepositoryMock.saveMany.mockReturnValue(Promise.resolve([]));

		await Container.get(ServicesService).createServicesAdmins([admin], 'token');

		expect(service.serviceAdminGroupMap.serviceOrganisationRef).toEqual('service-abc:orga');
		expect(MolUsersServiceMock.molUpsertUser).toBeCalled();
		expect(ServicesRepositoryMock.getServicesByName).toBeCalled();
		expect(ServicesRepositoryMock.saveMany).toBeCalled();
	});

	it('should throw invalid URL error', async () => {
		const request = new ServiceRequestV1();
		request.name = 'John';
		request.organisationId = 1;
		OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(
			Promise.resolve({ _organisationAdminGroupMap: { organisationRef: 'orga' } }),
		);

		request.videoConferenceUrl = 'www.abc.com';

		let error: string;
		try {
			await Container.get(ServicesService).createService(request);
		} catch (e) {
			error = e.message as string;
		}

		expect(error).toEqual(`[10301] Invalid URL`);
	});

	it('(a) should save service', async () => {
		const request = new ServiceRequestV1();
		request.name = 'John';
		request.organisationId = 1;
		OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(
			Promise.resolve({ _organisationAdminGroupMap: { organisationRef: 'orga' } }),
		);

		request.labels = [{ label: 'label' }];
		request.emailSuffix = 'abc.com';
		request.videoConferenceUrl = 'http://www.zoom.us/123456';

		await Container.get(ServicesService).createService(request);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].name).toBe('John');
		expect(ServicesRepositoryMock.save.mock.calls[0][0].isSpAutoAssigned).toBe(false);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].emailSuffix).toBe('abc.com');
		expect(ServicesRepositoryMock.save.mock.calls[0][0].videoConferenceUrl).toBe('http://www.zoom.us/123456');
		expect(ServicesRepositoryMock.getService).toBeCalledWith({
			id: 2,
			includeLabelCategories: true,
			includeLabels: true,
			includeScheduleForm: false,
			includeTimeslotsSchedule: false,
		});
	});

	it('should not create a service with existing name', async () => {
		const existingService = new ServiceRequestV1();
		existingService.organisationId = 1;
		existingService.labels = [];
		existingService.name = 'bookingsg';

		OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(
			Promise.resolve({ _organisationAdminGroupMap: { organisationRef: 'orga' } }),
		);
		ServicesRepositoryMock.save.mockImplementation(() =>
			Promise.reject(new Error('duplicate key value violates unique constraint')),
		);

		const request = new ServiceRequestV1();
		request.name = 'bookingsg';
		request.organisationId = 1;

		const instance = Container.get(ServicesService);
		const asyncTest = async () => await instance.createService(request);
		await expect(asyncTest).rejects.toMatchInlineSnapshot(
			'[SYS_INVALID_PARAM (400): Service name is already present]',
		);
	});

	it('should NOT save service without permission', async () => {
		const request = new ServiceRequestV1();
		request.name = 'John';
		request.organisationId = 1;
		OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(
			Promise.resolve({ _organisationAdminGroupMap: { organisationRef: 'orga' } }),
		);
		visitorObject.hasPermission.mockReturnValue(false);

		request.labels = [{ label: 'label' }];
		const asyncTest = () => Container.get(ServicesService).createService(request);

		await expect(asyncTest).rejects.toThrowErrorMatchingInlineSnapshot(
			`"User cannot perform this action (Create) for services."`,
		);
	});

	it('should save service & set SpAutoAssigned', async () => {
		const request = new ServiceRequestV1();
		request.name = 'John';
		request.organisationId = 1;
		request.isSpAutoAssigned = true;
		OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(
			Promise.resolve({ _organisationAdminGroupMap: { organisationRef: 'orga' } }),
		);

		request.labels = [{ label: 'label' }];
		await Container.get(ServicesService).createService(request);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].isSpAutoAssigned).toBe(true);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].labels).toHaveLength(1);
	});

	it('should save service with additional settings (optional settings)', async () => {
		const request = new ServiceRequestV1();
		request.name = 'John';
		request.organisationId = 1;
		OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(
			Promise.resolve({ _organisationAdminGroupMap: { organisationRef: 'orga' } }),
		);
		request.additionalSettings = {
			allowAnonymousBookings: true,
			isOnHold: true,
			isStandAlone: true,
			sendNotifications: true,
			sendNotificationsToServiceProviders: true,
			sendSMSNotifications: true,
		};

		await Container.get(ServicesService).createService(request);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].name).toBe('John');
		expect(ServicesRepositoryMock.save.mock.calls[0][0].citizenAuthentication).toEqual(['singpass', 'otp']);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].isOnHold).toBe(true);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].isStandAlone).toBe(true);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].sendNotifications).toBe(true);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].sendNotificationsToServiceProviders).toBe(true);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].sendSMSNotifications).toBe(true);
	});

	it('should save service with EMPTY additional settings (optional settings)', async () => {
		const request = new ServiceRequestV1();
		request.name = 'John';
		request.organisationId = 1;
		OrganisationsRepositoryMock.getOrganisationById.mockReturnValue(
			Promise.resolve({ _organisationAdminGroupMap: { organisationRef: 'orga' } }),
		);

		await Container.get(ServicesService).createService(request);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].name).toBe('John');
	});

	it('should update service', async () => {
		const newService = Service.create('service1', organisation);
		newService.id = 1;
		newService.organisationId = 1;
		newService.labels = [];

		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(newService));
		ServicesRepositoryMock.save.mockImplementation(() => Promise.resolve(newService));

		const request = new ServiceRequestV1();
		request.name = 'John';
		request.organisationId = 1;
		request.isSpAutoAssigned = true;
		request.emailSuffix = 'def.com';

		await Container.get(ServicesService).updateService(1, request);
		expect(ServicesRepositoryMock.save).toBeCalled();
		expect(ServicesRepositoryMock.save.mock.calls[0][0].name).toBe('John');
		expect(ServicesRepositoryMock.save.mock.calls[0][0].isSpAutoAssigned).toBe(true);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].labels).toHaveLength(0);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].emailSuffix).toBe('def.com');
	});

	it('should NOT update service without permission', async () => {
		const newService = Service.create('service1', organisation);
		newService.id = 1;
		newService.organisationId = 1;
		newService.labels = [];

		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(newService));
		ServicesRepositoryMock.save.mockImplementation(() => Promise.resolve(newService));
		visitorObject.hasPermission.mockReturnValue(false);

		const request = new ServiceRequestV1();
		request.name = 'John';
		request.organisationId = 1;
		request.isSpAutoAssigned = true;
		const asyncTest = () => Container.get(ServicesService).updateService(1, request);

		await expect(asyncTest).rejects.toThrowErrorMatchingInlineSnapshot(
			`"User cannot perform this action (Update) for services."`,
		);
	});

	it('should update service with additional settings (optional settings)', async () => {
		const newService = Service.create('service1', organisation);
		newService.id = 1;
		newService.organisationId = 1;
		newService.labels = [];

		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(newService));
		ServicesRepositoryMock.save.mockImplementation(() => Promise.resolve(newService));

		const request = new ServiceRequestV1();
		request.name = 'John';
		request.organisationId = 1;
		request.emailSuffix = 'def.com';
		request.additionalSettings = {
			allowAnonymousBookings: true,
			isOnHold: true,
			isStandAlone: true,
			sendNotifications: true,
			sendNotificationsToServiceProviders: true,
			sendSMSNotifications: true,
		};

		await Container.get(ServicesService).updateService(1, request);
		expect(ServicesRepositoryMock.save).toBeCalled();
		expect(ServicesRepositoryMock.save.mock.calls[0][0].name).toBe('John');
		expect(ServicesRepositoryMock.save.mock.calls[0][0].emailSuffix).toBe('def.com');
		expect(ServicesRepositoryMock.save.mock.calls[0][0].citizenAuthentication).toEqual(['singpass', 'otp']);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].isOnHold).toBe(true);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].isStandAlone).toBe(true);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].sendNotifications).toBe(true);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].sendNotificationsToServiceProviders).toBe(true);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].sendSMSNotifications).toBe(true);
	});

	it('should throw if service not found', async () => {
		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(undefined));
		const request = new ServiceRequestV1();
		request.name = 'John';

		await expect(async () => await Container.get(ServicesService).updateService(1, request)).rejects.toThrowError();
	});

	it('should set service scheduleForm', async () => {
		const newService = Service.create('service1', organisation);
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
		const newService = Service.create('service1', organisation);
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
		const service = Service.create('service1', organisation);
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
		const request = new ServiceRequestV1();
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
		const request = new ServiceRequestV1();
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
		const newService = Service.create('Service A', organisation);
		newService.id = 1;
		newService.organisationId = 1;
		newService.labels = [Label.create('Chinese', 1), Label.create('English', 2)];

		ServicesRepositoryMock.getService.mockImplementation(() => Promise.resolve(newService));
		ServicesRepositoryMock.save.mockImplementation(() => Promise.resolve(newService));

		const request = new ServiceRequestV1();
		request.name = 'Service A';
		request.labels = [{ label: 'Tamil' }];
		TransactionManagerMock.save.mockImplementation(() => Promise.resolve(newService));
		await Container.get(ServicesService).updateService(1, request);
		expect(ServicesRepositoryMock.save.mock.calls[0][0].labels).toHaveLength(1);
	});
});

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
