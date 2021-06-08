import { ScheduleFormsService } from '../scheduleForms.service';
import { ScheduleFormRequest, WeekDayBreakContract, WeekDayScheduleContract } from '../scheduleForms.apicontract';
import { ScheduleFormsRepository } from '../scheduleForms.repository';
import { Container } from 'typescript-ioc';
import { Organisation, Service, ServiceProvider, User } from '../../../models';
import { Weekday } from '../../../enums/weekday';
import { MOLErrorV2 } from 'mol-lib-api-contract';
import { TimeslotsScheduleRepository } from '../../timeslotsSchedules/timeslotsSchedule.repository';
import { ScheduleFormsActionAuthVisitor } from '../scheduleForms.auth';
import { UserContext } from '../../../infrastructure/auth/userContext';
import { OrganisationAdminAuthGroup } from '../../../infrastructure/auth/authGroup';
import { AsyncFunction, TransactionManager } from '../../../core/transactionManager';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { UserContextMock } from '../../../infrastructure/auth/__mocks__/userContext';
import { TransactionManagerMock } from '../../../core/__mocks__/transactionManager.mock';

jest.mock('../scheduleForms.auth');

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

const visitorObject = {
	hasPermission: jest.fn(),
};

const serviceMockWithTemplate = new Service();
serviceMockWithTemplate.id = 2;

const userMock = User.createAdminUser({
	molAdminId: 'd080f6ed-3b47-478a-a6c6-dfb5608a199d',
	userName: 'UserName',
	email: 'test@email.com',
	name: 'Name',
});

const organisation = new Organisation();
organisation.id = 1;

// tslint:disable-next-line: no-big-function
describe('Schedules form template services ', () => {
	beforeAll(() => {
		Container.bind(UserContext).to(UserContextMock);
		Container.bind(ScheduleFormsRepository).to(ScheduleFormsRepositoryMock);
		Container.bind(TimeslotsScheduleRepository).to(TimeslotsScheduleRepositoryMock);
		Container.bind(TransactionManager).to(TransactionManagerMock);
	});

	beforeEach(() => {
		jest.clearAllMocks();

		visitorObject.hasPermission.mockReturnValue(true);
		(ScheduleFormsActionAuthVisitor as jest.Mock).mockImplementation(() => visitorObject);
		UserContextMock.getCurrentUser.mockImplementation(() => Promise.resolve(userMock));
		UserContextMock.getAuthGroups.mockImplementation(() =>
			Promise.resolve([new OrganisationAdminAuthGroup(userMock, [organisation])]),
		);
		TransactionManagerMock.runInTransaction.mockImplementation(
			async <T extends unknown>(_isolationLevel: IsolationLevel, asyncFunction: AsyncFunction<T>): Promise<T> =>
				await asyncFunction(),
		);
	});

	it('should throw error because open and close times have wrong format', async () => {
		const entity = ServiceProvider.create('Jhon', 1);
		const saveEntity = jest.fn<Promise<typeof entity>, any>((e) => Promise.resolve(e));
		const scheduleFormsRequest: ScheduleFormRequest = {
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
			const scheduleFormsService = Container.get(ScheduleFormsService);
			await scheduleFormsService.updateScheduleFormInEntity(scheduleFormsRequest, entity, saveEntity);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
		}
		expect(ScheduleFormsRepositoryMock.saveScheduleForm).toBeCalledTimes(0);
	});

	it('should throw error because close time have wrong format', async () => {
		const entity = ServiceProvider.create('Jhon', 1);
		const saveEntity = jest.fn<Promise<typeof entity>, any>((e) => Promise.resolve(e));
		const scheduleFormsRequest: ScheduleFormRequest = {
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
			const scheduleFormsService = Container.get(ScheduleFormsService);
			await scheduleFormsService.updateScheduleFormInEntity(scheduleFormsRequest, entity, saveEntity);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
		}
		expect(ScheduleFormsRepositoryMock.saveScheduleForm).toBeCalledTimes(0);
	});

	it('should throw error because openTime > closeTime', async () => {
		const entity = ServiceProvider.create('Jhon', 1);
		const saveEntity = jest.fn<Promise<typeof entity>, any>((e) => Promise.resolve(e));
		const scheduleFormsRequest: ScheduleFormRequest = {
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
			const scheduleFormsService = Container.get(ScheduleFormsService);
			await scheduleFormsService.updateScheduleFormInEntity(scheduleFormsRequest, entity, saveEntity);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
		}
		expect(ScheduleFormsRepositoryMock.saveScheduleForm).toBeCalledTimes(0);
	});

	it('should throw error because slotsDurationInMin < (closeTime - openTime)', async () => {
		const entity = ServiceProvider.create('Jhon', 1);
		const saveEntity = jest.fn<Promise<typeof entity>, any>((e) => Promise.resolve(e));
		const scheduleFormsRequest: ScheduleFormRequest = {
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
			const scheduleFormsService = Container.get(ScheduleFormsService);
			await scheduleFormsService.updateScheduleFormInEntity(scheduleFormsRequest, entity, saveEntity);
		} catch (e) {
			expect(e.message).toBe('Invalid request parameters.');
			expect((e as MOLErrorV2).responseData).toMatchSnapshot();
		}
		expect(ScheduleFormsRepositoryMock.saveScheduleForm).toBeCalledTimes(0);
		expect(saveEntity).toBeCalledTimes(0);
	});

	it('should generate timeslots', async () => {
		const entity = ServiceProvider.create('Jhon', 2);
		entity.id = 1;
		entity.service = new Service();
		entity.service.id = 2;
		const saveEntity = jest.fn<Promise<typeof entity>, any>((e) => Promise.resolve(e));
		const scheduleFormsRequest: ScheduleFormRequest = {
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

		ScheduleFormsRepositoryMock.saveScheduleForm.mockImplementation((e) => Promise.resolve(e));

		const scheduleFormsService = Container.get(ScheduleFormsService);
		await scheduleFormsService.updateScheduleFormInEntity(scheduleFormsRequest, entity, saveEntity);

		expect(ScheduleFormsRepositoryMock.saveScheduleForm).toBeCalledTimes(1);
		expect(saveEntity).toBeCalledTimes(1);

		const timeslotSchedule = entity.timeslotsSchedule;
		expect(timeslotSchedule).toBeDefined();
		expect(timeslotSchedule.timeslotItems[0]._startTime.toString()).toBe('08:30');
		expect(timeslotSchedule.timeslotItems[0]._endTime.toString()).toBe('09:30');
		expect(timeslotSchedule.timeslotItems[1]._startTime.toString()).toBe('09:30');
		expect(timeslotSchedule.timeslotItems[1]._endTime.toString()).toBe('10:30');
		expect(timeslotSchedule.timeslotItems[2]._startTime.toString()).toBe('11:30');
		expect(timeslotSchedule.timeslotItems[2]._endTime.toString()).toBe('12:30');
	});

	it('should delete old schedule form', async () => {
		const entity = ServiceProvider.create('Jhon', 2);
		entity.id = 1;
		entity.service = new Service();
		entity.service.id = 2;
		entity.scheduleFormId = 5;
		const saveEntity = jest.fn<Promise<typeof entity>, any>((e) => Promise.resolve(e));
		const scheduleFormsRequest: ScheduleFormRequest = {
			slotsDurationInMin: 60,
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasScheduleForm: true,
					openTime: '08:30',
					closeTime: '12:30',
					breaks: [],
				} as WeekDayScheduleContract,
			],
		} as ScheduleFormRequest;

		ScheduleFormsRepositoryMock.saveScheduleForm.mockImplementation((e) => Promise.resolve(e));
		ScheduleFormsRepositoryMock.deleteScheduleForm.mockImplementation(() => Promise.resolve());

		const scheduleFormsService = Container.get(ScheduleFormsService);
		await scheduleFormsService.updateScheduleFormInEntity(scheduleFormsRequest, entity, saveEntity);

		expect(ScheduleFormsRepositoryMock.saveScheduleForm).toBeCalledTimes(1);
		expect(saveEntity).toBeCalledTimes(1);
		expect(ScheduleFormsRepositoryMock.deleteScheduleForm).toBeCalledWith(5);
	});

	it('should delete old timeslot schedule', async () => {
		const entity = ServiceProvider.create('Jhon', 2);
		entity.id = 1;
		entity.service = new Service();
		entity.service.id = 2;
		entity.timeslotsScheduleId = 6;
		const saveEntity = jest.fn<Promise<typeof entity>, any>((e) => Promise.resolve(e));
		const scheduleFormsRequest: ScheduleFormRequest = {
			slotsDurationInMin: 60,
			weekdaySchedules: [
				{
					weekday: Weekday.Monday,
					hasScheduleForm: true,
					openTime: '08:30',
					closeTime: '12:30',
					breaks: [],
				} as WeekDayScheduleContract,
			],
		} as ScheduleFormRequest;

		ScheduleFormsRepositoryMock.saveScheduleForm.mockImplementation((e) => Promise.resolve(e));
		TimeslotsScheduleRepositoryMock.deleteTimeslotsSchedule.mockImplementation(() => Promise.resolve());

		const scheduleFormsService = Container.get(ScheduleFormsService);
		await scheduleFormsService.updateScheduleFormInEntity(scheduleFormsRequest, entity, saveEntity);

		expect(ScheduleFormsRepositoryMock.saveScheduleForm).toBeCalledTimes(1);
		expect(saveEntity).toBeCalledTimes(1);
		expect(TimeslotsScheduleRepositoryMock.deleteTimeslotsSchedule).toBeCalledWith(6);
	});
});

class ScheduleFormsRepositoryMock implements Partial<ScheduleFormsRepository> {
	public static saveScheduleForm = jest.fn();
	public static deleteScheduleForm = jest.fn();

	public async saveScheduleForm(...params): Promise<any> {
		return await ScheduleFormsRepositoryMock.saveScheduleForm(...params);
	}

	public async deleteScheduleForm(...params): Promise<any> {
		return await ScheduleFormsRepositoryMock.deleteScheduleForm(...params);
	}
}

class TimeslotsScheduleRepositoryMock implements Partial<TimeslotsScheduleRepository> {
	public static deleteTimeslotsSchedule = jest.fn();

	public async deleteTimeslotsSchedule(...params): Promise<any> {
		return await TimeslotsScheduleRepositoryMock.deleteTimeslotsSchedule(...params);
	}
}
