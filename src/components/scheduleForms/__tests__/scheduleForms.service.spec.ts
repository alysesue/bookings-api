import { ScheduleFormsService } from '../scheduleForms.service';
import { ScheduleFormRequest, WeekDayBreakContract, WeekDayScheduleContract } from '../scheduleForms.apicontract';
import { ScheduleFormsRepository } from '../scheduleForms.repository';
import { Container } from 'typescript-ioc';
import { ScheduleForm, Service, ServiceProvider, TimeslotsSchedule, User } from '../../../models';
import { mapToEntity } from '../scheduleForms.mapper';
import { Weekday } from '../../../enums/weekday';
import { MOLErrorV2 } from 'mol-lib-api-contract';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { TimeslotsScheduleRepository } from '../../timeslotsSchedules/timeslotsSchedule.repository';
import { TimeslotItemsSearchRequest } from '../../timeslotItems/timeslotItems.repository';
import { UserContextMock } from '../../bookings/__tests__/bookings.mocks';
import { ServiceAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { UserContext } from '../../../infrastructure/auth/userContext';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const scheduleFormRequestCommon = {
	serviceProviderId: 1,
	name: 'schedule',
	slotsDurationInMin: 60,
	weekdaySchedules: [
		{
			weekday: Weekday.Monday,
			hasScheduleForm: true,
			openTime: '08:30',
			closeTime: '12:30',
			breaks: [{ startTime: '11:00', endTime: '11:30' } as WeekDayBreakContract],
		} as WeekDayScheduleContract,
	],
} as ScheduleFormRequest;

const scheduleCommon = new ScheduleForm();
mapToEntity(scheduleFormRequestCommon, scheduleCommon);

const getScheduleForms = jest.fn().mockImplementation(() => Promise.resolve([scheduleCommon]));
const getScheduleFormById = jest.fn().mockImplementation(() => Promise.resolve(scheduleCommon));
const getScheduleFormByName = jest.fn().mockImplementation(() => Promise.resolve(scheduleCommon));
const saveScheduleForm = jest.fn().mockImplementation(() => Promise.resolve(scheduleCommon));
const deleteScheduleForm = jest.fn().mockImplementation(() => Promise.resolve(undefined));
const MockScheduleFormsRepository = jest.fn().mockImplementation(() => ({
	getScheduleForms,
	saveScheduleForm,
	getScheduleFormById,
	getScheduleFormByName,
	deleteScheduleForm,
}));

const serviceMockWithTemplate = new Service();
const adminMock = User.createAdminUser({
	molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
	userName: 'UserName',
	email: 'test@email.com',
	name: 'Name',
});
// tslint:disable-next-line
describe('Schedules form template services ', () => {
	let scheduleFormsService: ScheduleFormsService;
	beforeAll(() => {
		Container.bind(ScheduleFormsRepository).to(MockScheduleFormsRepository);
		Container.bind(ServiceProvidersRepository).to(ServiceProvidersRepositoryMock);
		Container.bind(UserContext).to(UserContextMock);
		scheduleFormsService = Container.get(ScheduleFormsService);
	});
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should throw error because open and close times have wrong format', async () => {
		const scheduleFormsRequest: ScheduleFormRequest = {
			name: 'schedule',
			slotsDurationInMin: 5,
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasScheduleForm: true,
					openTime: '2323',
					closeTime: '25:25',
				} as WeekDayScheduleContract,
			],
		} as ScheduleFormRequest;

		try {
			await scheduleFormsService.createScheduleForm(scheduleFormsRequest);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
		}
		expect(saveScheduleForm).toBeCalledTimes(0);
	});

	it('should throw error because close time have wrong format', async () => {
		const scheduleFormsRequest: ScheduleFormRequest = {
			name: 'schedule',
			slotsDurationInMin: 5,
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasScheduleForm: true,
					openTime: '23:23',
					closeTime: '11:73',
				} as WeekDayScheduleContract,
			],
		} as ScheduleFormRequest;

		try {
			await scheduleFormsService.createScheduleForm(scheduleFormsRequest);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
		}
		expect(saveScheduleForm).toBeCalledTimes(0);
	});

	it('should throw error because openTime > closeTime', async () => {
		const scheduleFormsRequest: ScheduleFormRequest = {
			name: 'schedule',
			slotsDurationInMin: 5,
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasScheduleForm: true,
					openTime: '23:23',
					closeTime: '11:23',
				} as WeekDayScheduleContract,
			],
		} as ScheduleFormRequest;

		try {
			await scheduleFormsService.createScheduleForm(scheduleFormsRequest);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
		}
		expect(saveScheduleForm).toBeCalledTimes(0);
	});

	it('should throw error because slotsDurationInMin < (closeTime - openTime)', async () => {
		const scheduleFormsRequest: ScheduleFormRequest = {
			name: 'schedule',
			slotsDurationInMin: 65,
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasScheduleForm: true,
					openTime: '11:23',
					closeTime: '12:23',
				} as WeekDayScheduleContract,
			],
		} as ScheduleFormRequest;

		try {
			await scheduleFormsService.createScheduleForm(scheduleFormsRequest);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
		}
		expect(saveScheduleForm).toBeCalledTimes(0);
	});

	it('should create new Schedule ', async () => {
		const sp = ServiceProvider.create('sp', 2);
		sp.id = 1;
		ServiceProvidersRepositoryMock.getServiceProviderMock = sp;
		await scheduleFormsService.createScheduleForm(scheduleFormRequestCommon);
		expect(saveScheduleForm).toBeCalledTimes(1);
	});

	it('should update the template', async () => {
		const template = await scheduleFormsService.updateScheduleForm(1, scheduleFormRequestCommon);

		expect(saveScheduleForm).toBeCalled();
		expect(getScheduleFormById).toBeCalled();
		expect(template.name).toStrictEqual(scheduleFormRequestCommon.name);
	});

	it('should get scheduleForms', async () => {
		await scheduleFormsService.getScheduleForms();
		expect(getScheduleForms).toBeCalled();
	});

	it('should call delete repository', async () => {
		UserContextMock.getAuthGroups.mockReturnValue(
			Promise.resolve([new ServiceAdminAuthGroup(adminMock, [serviceMockWithTemplate])]),
		);

		await scheduleFormsService.deleteScheduleForm(3);
		expect(deleteScheduleForm).toBeCalled();
	});

	it('should generate timeslots', async () => {
		const sp = ServiceProvider.create('sp', 2);
		sp.id = 1;
		ServiceProvidersRepositoryMock.getServiceProviderMock = sp;
		await scheduleFormsService.createScheduleForm(scheduleFormRequestCommon);
		const serviceProviderRes = ServiceProvidersRepositoryMock.save.mock.calls[0][0];
		expect(serviceProviderRes._timeslotsSchedule.timeslotItems.length).toBe(3);
		expect(serviceProviderRes._timeslotsSchedule.timeslotItems[0]._startTime.toString()).toBe('08:30');
		expect(serviceProviderRes._timeslotsSchedule.timeslotItems[0]._endTime.toString()).toBe('09:30');
		expect(serviceProviderRes._timeslotsSchedule.timeslotItems[1]._startTime.toString()).toBe('09:30');
		expect(serviceProviderRes._timeslotsSchedule.timeslotItems[1]._endTime.toString()).toBe('10:30');
		expect(serviceProviderRes._timeslotsSchedule.timeslotItems[2]._startTime.toString()).toBe('11:30');
		expect(serviceProviderRes._timeslotsSchedule.timeslotItems[2]._endTime.toString()).toBe('12:30');
	});
});

class ServiceProvidersRepositoryMock extends ServiceProvidersRepository {
	public static sp: ServiceProvider;
	public static getServiceProviderMock: ServiceProvider;
	public static save = jest.fn();

	public async getServiceProvider(...params): Promise<ServiceProvider> {
		return Promise.resolve(ServiceProvidersRepositoryMock.getServiceProviderMock);
	}

	public async save(sp: ServiceProvider): Promise<ServiceProvider> {
		return await ServiceProvidersRepositoryMock.save(sp);
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
