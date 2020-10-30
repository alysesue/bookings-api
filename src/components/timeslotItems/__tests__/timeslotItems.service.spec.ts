import { Container } from 'typescript-ioc';
import { Service, ServiceProvider, TimeOfDay, TimeslotItem, TimeslotsSchedule, User } from '../../../models';
import { TimeslotItemsService } from '../timeslotItems.service';
import { TimeslotItemRequest } from '../timeslotItems.apicontract';
import { TimeslotItemsRepository } from '../timeslotItems.repository';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { Weekday } from '../../../enums/weekday';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { AuthGroup, ServiceAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { TimeslotsScheduleRepository } from '../../timeslotsSchedules/timeslotsSchedule.repository';
import { TimeslotItemsActionAuthVisitor } from '../timeslotItems.auth';

jest.mock('../timeslotItems.auth');

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const saveTimeslotItem = jest.fn();
const saveTimeslotItems = jest.fn();
const deleteTimeslotItem = jest.fn();
const getTimeslotItem = jest.fn();
const TimeslotItemsRepositoryMock = jest.fn();

// tslint:disable-next-line: no-big-function
describe('TimeslotsItem services ', () => {
	const service = new Service();
	service.id = 1;

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
	timeslotsScheduleMock._service = service;
	const request = new TimeslotItemRequest();

	const adminMock = User.createAdminUser({
		molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
		userName: 'UserName',
		email: 'test@email.com',
		name: 'Name',
	});
	const visitorObj = {
		hasPermission: jest.fn(),
	};

	beforeAll(() => {
		Container.bind(TimeslotsScheduleRepository).to(TimeslotsScheduleRepositoryMock);
		Container.bind(TimeslotItemsRepository).to(TimeslotItemsRepositoryMock);
		Container.bind(UserContext).to(UserContextMock);
	});
	beforeEach(() => {
		TimeslotItemsRepositoryMock.mockImplementation(() => ({
			saveTimeslotItem,
			deleteTimeslotItem,
			saveTimeslotItems,
			getTimeslotItem,
		}));

		saveTimeslotItem.mockImplementation((item) => Promise.resolve(item));
		saveTimeslotItems.mockImplementation((item) => Promise.resolve([item]));
		getTimeslotItem.mockImplementation((item) => Promise.resolve(item));

		const serviceMock = new Service();
		serviceMock.id = 1;

		const serviceProvideMock = ServiceProvider.create('Peter', service.id, 'test@email.com', '0000');
		serviceProvideMock.id = 1;

		timeslotItemMock._id = 4;
		timeslotsScheduleMock._id = 1;
		timeslotsScheduleMock._service = serviceMock;
		timeslotsScheduleMock._serviceProvider = serviceProvideMock;

		request.weekDay = Weekday.Thursday;
		request.startTime = '11:00';
		request.endTime = '12:00';

		visitorObj.hasPermission.mockReturnValue(true);

		(TimeslotItemsActionAuthVisitor as jest.Mock).mockImplementation(() => {
			return visitorObj;
		});
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should create timeslots item', async () => {
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(adminMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [service])]),
		);

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.createTimeslotItem(timeslotsScheduleMock, request);
		expect(saveTimeslotItem).toBeCalled();
		expect(visitorObj.hasPermission).toBeCalled();
	});

	it('should validate start time is less than end time', async () => {
		request.weekDay = Weekday.Thursday;
		request.startTime = '08:00';
		request.endTime = '07:00';

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await expect(
			async () => await timeslotItemsService.createTimeslotItem(timeslotsScheduleMock, request),
		).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Timeslot start time must be less than end time.'),
		);
	});

	it('should set capacity=1 by default', async () => {
		request.weekDay = Weekday.Thursday;
		request.startTime = '06:00';
		request.endTime = '07:00';

		const timeslotItemsService = Container.get(TimeslotItemsService);
		const res = await timeslotItemsService.createTimeslotItem(timeslotsScheduleMock, request);
		expect(res._capacity).toBe(1);
	});

	it('should validate start time / end time when creating timeslots item', async () => {
		request.weekDay = Weekday.Thursday;
		request.startTime = 'asdasd';
		request.endTime = 'bbb';

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await expect(
			async () => await timeslotItemsService.createTimeslotItem(timeslotsScheduleMock, request),
		).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Value asdasd is not a valid time.'),
		);
	});

	it('should validate overlaps', async () => {
		request.weekDay = Weekday.Monday;
		request.startTime = '11:15';
		request.endTime = '12:15';
		timeslotsScheduleMock.timeslotItems = [timeslotItemMock];
		const timeslotItemsService = Container.get(TimeslotItemsService);
		await expect(
			async () => await timeslotItemsService.createTimeslotItem(timeslotsScheduleMock, request),
		).rejects.toStrictEqual(
			new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Timeslot item overlaps existing entry.'),
		);
	});

	it('should not validate overlap when updating same item', async () => {
		const serviceMock = new Service();
		serviceMock.id = 1;
		request.weekDay = Weekday.Monday;
		request.startTime = '11:15';
		request.endTime = '12:15';

		const timeslotItemMockForUpdate = TimeslotItem.create(
			1,
			Weekday.Monday,
			TimeOfDay.create({
				hours: 11,
				minutes: 0,
			}),
			TimeOfDay.create({ hours: 11, minutes: 30 }),
		);
		timeslotItemMockForUpdate._id = 4;
		timeslotsScheduleMock._service = serviceMock;
		const scheduleForUpdate = new TimeslotsSchedule();
		scheduleForUpdate._id = 1;
		scheduleForUpdate.timeslotItems = [timeslotItemMockForUpdate];
		scheduleForUpdate._service = serviceMock;

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.updateTimeslotItem(scheduleForUpdate, 4, request);
		expect(saveTimeslotItem).toBeCalled();
	});

	it('should not validate overlaps on different week days', async () => {
		request.weekDay = Weekday.Tuesday;
		request.startTime = '11:15';
		request.endTime = '12:15';

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.createTimeslotItem(timeslotsScheduleMock, request);
		expect(saveTimeslotItem).toHaveBeenCalled();
	});

	it('should update timeslots item', async () => {
		request.weekDay = Weekday.Thursday;
		request.startTime = '07:00';
		request.endTime = '08:00';

		const serviceMockForUpdate = new Service();
		serviceMockForUpdate.id = 1;
		serviceMockForUpdate.name = 'service';

		const timeslotItemMockForUpdate = TimeslotItem.create(
			1,
			1,
			TimeOfDay.create({
				hours: 11,
				minutes: 0,
			}),
			TimeOfDay.create({ hours: 11, minutes: 30 }),
		);
		timeslotItemMockForUpdate._id = 4;
		const scheduleForUpdate = new TimeslotsSchedule();
		scheduleForUpdate._id = 1;
		scheduleForUpdate.timeslotItems = [timeslotItemMockForUpdate];
		scheduleForUpdate._service = serviceMockForUpdate;

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.updateTimeslotItem(scheduleForUpdate, 4, request);
		expect(saveTimeslotItem).toBeCalled();
		expect(visitorObj.hasPermission).toBeCalled();
	});

	it('should throw when updating wrong timeslot id', async () => {
		request.weekDay = 4;
		request.startTime = '07:00';
		request.endTime = '08:00';

		const serviceMockForUpdate = new Service();
		serviceMockForUpdate.id = 1;
		serviceMockForUpdate.name = 'service';

		const timeslotItemMockForUpdate = TimeslotItem.create(
			1,
			1,
			TimeOfDay.create({
				hours: 11,
				minutes: 0,
			}),
			TimeOfDay.create({ hours: 11, minutes: 30 }),
		);
		timeslotItemMockForUpdate._id = 4;
		const scheduleForUpdate = new TimeslotsSchedule();
		scheduleForUpdate._id = 1;
		scheduleForUpdate.timeslotItems = [timeslotItemMockForUpdate];

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await expect(
			async () => await timeslotItemsService.updateTimeslotItem(scheduleForUpdate, 5, request),
		).rejects.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Timeslot item not found'));
	});

	it('should delete timeslot item', async () => {
		const serviceMock = new Service();
		serviceMock.id = 1;
		TimeslotsScheduleRepositoryMock.getTimeslotsScheduleById.mockReturnValue(
			Promise.resolve(timeslotsScheduleMock),
		);
		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.deleteTimeslot({ id: 1 });
		expect(deleteTimeslotItem).toBeCalledTimes(1);
		expect(visitorObj.hasPermission).toBeCalled();
	});
});

export class UserContextMock extends UserContext {
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

export class TimeslotsScheduleRepositoryMock extends TimeslotsScheduleRepository {
	public static getTimeslotsScheduleById = jest.fn<Promise<TimeslotsSchedule>, any>();

	public async getTimeslotsScheduleById(...params): Promise<any> {
		return await TimeslotsScheduleRepositoryMock.getTimeslotsScheduleById(...params);
	}
}
