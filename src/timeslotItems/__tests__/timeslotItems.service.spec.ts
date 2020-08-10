import { Container } from "typescript-ioc";
import { Service, TimeOfDay, TimeslotItem, TimeslotsSchedule } from "../../models";
import { TimeslotItemsService } from "../timeslotItems.service";
import { TimeslotItemRequest } from "../timeslotItems.apicontract";
import { TimeslotItemsRepository } from "../timeslotItems.repository";
import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { Weekday } from "../../enums/weekday";


const saveTimeslotItem = jest.fn().mockImplementation((item) => Promise.resolve(item));
const saveTimeslotItems = jest.fn().mockImplementation((item) => Promise.resolve([item]));
const deleteTimeslotItem = jest.fn();
const TimeslotItemsRepositoryMock = jest.fn().mockImplementation(() => ({
	saveTimeslotItem,
	deleteTimeslotItem,
	saveTimeslotItems
}));

describe('TimeslotsSchedule template services ', () => {
	const timeslotItemMock = TimeslotItem.create(1, Weekday.Monday, TimeOfDay.create({
		hours: 11,
		minutes: 0
	}), TimeOfDay.create({ hours: 11, minutes: 30 }));
	const timeslotsScheduleMock = new TimeslotsSchedule();
	const request = new TimeslotItemRequest();

	beforeAll(() => {
		Container.bind(TimeslotItemsRepository).to(TimeslotItemsRepositoryMock);
	});
	beforeEach(() => {
		timeslotItemMock._id = 4;

		timeslotsScheduleMock._id = 1;

		request.weekDay = Weekday.Thursday;
		request.startTime = "11:00";
		request.endTime = "12:00";
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should create timeslots item', async () => {
		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.createTimeslotItem(timeslotsScheduleMock, request);
		expect(saveTimeslotItem).toBeCalled();
	});

	it('should validate start time is less than end time', async () => {
		request.weekDay = Weekday.Thursday;
		request.startTime = "08:00";
		request.endTime = "07:00";

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await expect(async () => await timeslotItemsService.createTimeslotItem(timeslotsScheduleMock, request))
			.rejects.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Timeslot start time must be less than end time.'));
	});

	it('should validate start time / end time when creating timeslots item', async () => {
		request.weekDay = Weekday.Thursday;
		request.startTime = "asdasd";
		request.endTime = "bbb";

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await expect(async () => await timeslotItemsService.createTimeslotItem(timeslotsScheduleMock, request))
			.rejects.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Value asdasd is not a valid time.'));
	});

	it('should validate overlaps', async () => {
		request.weekDay = Weekday.Monday;
		request.startTime = "11:15";
		request.endTime = "12:15";
		timeslotsScheduleMock.timeslotItems = [timeslotItemMock];
		const timeslotItemsService = Container.get(TimeslotItemsService);
		await expect(async () => await timeslotItemsService.createTimeslotItem(timeslotsScheduleMock, request))
			.rejects.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Timeslot item overlaps existing entry.'));
	});

	it('should not validate overlap when updating same item', async () => {
		request.weekDay = Weekday.Monday;
		request.startTime = "11:15";
		request.endTime = "12:15";

		const timeslotItemMockForUpdate = TimeslotItem.create(1, Weekday.Monday, TimeOfDay.create({
			hours: 11,
			minutes: 0
		}), TimeOfDay.create({ hours: 11, minutes: 30 }));
		timeslotItemMockForUpdate._id = 4;
		const scheduleForUpdate = new TimeslotsSchedule();
		scheduleForUpdate._id = 1;
		scheduleForUpdate.timeslotItems = [timeslotItemMockForUpdate];

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.updateTimeslotItem(scheduleForUpdate, 4, request);
		expect(saveTimeslotItem).toBeCalled();
	});

	it('should not validate overlaps on different week days', async () => {
		request.weekDay = Weekday.Tuesday;
		request.startTime = "11:15";
		request.endTime = "12:15";

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.createTimeslotItem(timeslotsScheduleMock, request);
		expect(saveTimeslotItem).toHaveBeenCalled();
	});

	it('should update timeslots item', async () => {
		request.weekDay = Weekday.Thursday;
		request.startTime = "07:00";
		request.endTime = "08:00";

		const serviceMockForUpdate = new Service();
		serviceMockForUpdate.id = 1;
		serviceMockForUpdate.name = 'service';

		const timeslotItemMockForUpdate = TimeslotItem.create(1, 1, TimeOfDay.create({
			hours: 11,
			minutes: 0
		}), TimeOfDay.create({ hours: 11, minutes: 30 }));
		timeslotItemMockForUpdate._id = 4;
		const scheduleForUpdate = new TimeslotsSchedule();
		scheduleForUpdate._id = 1;
		scheduleForUpdate.timeslotItems = [timeslotItemMockForUpdate];

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.updateTimeslotItem(scheduleForUpdate, 4, request);
		expect(saveTimeslotItem).toBeCalled();
	});

	it('should throw when updating wrong timeslot id', async () => {
		request.weekDay = 4;
		request.startTime = "07:00";
		request.endTime = "08:00";

		const serviceMockForUpdate = new Service();
		serviceMockForUpdate.id = 1;
		serviceMockForUpdate.name = 'service';

		const timeslotItemMockForUpdate = TimeslotItem.create(1, 1, TimeOfDay.create({
			hours: 11,
			minutes: 0
		}), TimeOfDay.create({ hours: 11, minutes: 30 }));
		timeslotItemMockForUpdate._id = 4;
		const scheduleForUpdate = new TimeslotsSchedule();
		scheduleForUpdate._id = 1;
		scheduleForUpdate.timeslotItems = [timeslotItemMockForUpdate];

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await expect(async () =>
			await timeslotItemsService.updateTimeslotItem(scheduleForUpdate, 5, request))
			.rejects.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Timeslot item not found'));
	});

	it('should delete timeslot item', async () => {
		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.deleteTimeslot(1);
		expect(deleteTimeslotItem).toBeCalledTimes(1);
	});

	it('should copy timeslotsSchedule', async () => {
		const timeslotItemsService = Container.get(TimeslotItemsService);
		const data = await timeslotItemsService.mapTimeslotItemsInTimeslotsSchedule([timeslotItemMock], timeslotsScheduleMock);
		// @ts-ignore
		expect(data[0]._timeslotsSchedule._id).toBe(1);
	});
});
