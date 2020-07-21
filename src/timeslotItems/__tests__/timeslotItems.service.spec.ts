import { Container } from "typescript-ioc";
import { Service, ServiceProvider, TimeOfDay, TimeslotItem, TimeslotsSchedule } from "../../models";
import { TimeslotItemsService } from "../timeslotItems.service";
import { TimeslotsScheduleRepository } from "../timeslotsSchedule.repository";
import { ServicesRepository } from "../../services/services.repository";
import { TimeslotItemRequest } from "../timeslotItems.apicontract";
import { TimeslotItemsRepository } from "../timeslotItems.repository";
import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { Weekday } from "../../enums/weekday";
import { ServiceProvidersRepository } from "../../serviceProviders/serviceProviders.repository";

const createTimeslotsSchedule = jest.fn();
const createTimeslotsScheduleForServiceProvider = jest.fn();
const MockTimeslotsScheduleRepository = jest.fn().mockImplementation(() => ({
	createTimeslotsSchedule,
	createTimeslotsScheduleForServiceProvider,
}));

const saveTimeslotItem = jest.fn().mockImplementation((item) => Promise.resolve(item));
const saveTimeslotItems = jest.fn().mockImplementation((item) => Promise.resolve([item]));
const deleteTimeslotItem = jest.fn();
const MockTimeslotItemsRepository = jest.fn().mockImplementation(() => ({
	saveTimeslotItem,
	deleteTimeslotItem,
	saveTimeslotItems
}));

const getServiceWithTimeslotsSchedule = jest.fn();
const getService = jest.fn();
const save = jest.fn().mockImplementation((param) => Promise.resolve(param));
const MockServicesRepository = jest.fn().mockImplementation(() => ({
	getService,
	getServiceWithTimeslotsSchedule,
	save
}));

const getServiceProvider = jest.fn();
const getServiceProviderTimeslotsSchedule = jest.fn();

const MockServiceProvidersRepository = jest.fn().mockImplementation(() => ({
	getServiceProvider,
	getServiceProviderTimeslotsSchedule,
	save
}));

describe('TimeslotsSchedule template services ', () => {
	const serviceMock = new Service();
	const serviceProviderMock = new ServiceProvider();
	const timeslotItemMock = TimeslotItem.create(1, Weekday.Monday, TimeOfDay.create({
		hours: 11,
		minutes: 0
	}), TimeOfDay.create({hours: 11, minutes: 30}));
	const timeslotsScheduleMock = new TimeslotsSchedule();
	const serviceMockWithTemplate = new Service();

	beforeAll(() => {
		Container.bind(TimeslotsScheduleRepository).to(MockTimeslotsScheduleRepository);
		Container.bind(TimeslotItemsRepository).to(MockTimeslotItemsRepository);
		Container.bind(ServicesRepository).to(MockServicesRepository);
		Container.bind(ServiceProvidersRepository).to(MockServiceProvidersRepository);
	});

	afterEach(() => {
		jest.clearAllMocks();
		serviceMock.id = 1;
		serviceMock.name = 'service';

		serviceProviderMock.id = 1;
		serviceProviderMock.serviceId = 1;
		serviceProviderMock.name = 'serviceProvider';

		timeslotItemMock._id = 4;

		timeslotsScheduleMock._id = 1;
		timeslotsScheduleMock.timeslotItems = [timeslotItemMock];

		serviceMockWithTemplate.id = 1;
		serviceMockWithTemplate.name = 'service';
		serviceMockWithTemplate.timeslotsScheduleId = timeslotsScheduleMock._id;
		serviceMockWithTemplate.timeslotsSchedule = timeslotsScheduleMock;
	});






	it('should get timeslots schedule', async () => {
		getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));
		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.getTimeslotItemsByServiceId(1);
		expect(getServiceWithTimeslotsSchedule).toBeCalled();
	});

	it('should get timeslots schedule for service provider', async () => {
		getServiceProvider.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));
		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.getTimeslotItemsByServiceProviderId(1);
		expect(getServiceProvider).toBeCalled();
	});

	it('should create timeslots item', async () => {
		const req = new TimeslotItemRequest();
		req.weekDay = Weekday.Thursday;
		req.startTime = "11:00";
		req.endTime = "12:00";
		getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(serviceMock));
		getService.mockImplementation(() => Promise.resolve(serviceMock));
		createTimeslotsSchedule.mockImplementation(() => Promise.resolve(timeslotsScheduleMock));

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.createTimeslotItem(1, req);
		expect(createTimeslotsSchedule).toBeCalled();
		expect(saveTimeslotItem).toBeCalled();
	});

	it('should copy timeslots schedule item for service to  service provider', async () => {
		const req = new TimeslotItemRequest();
		req.weekDay = Weekday.Thursday;
		req.startTime = "11:00";
		req.endTime = "12:00";
		const serviceMockWithTimeSlot = {...serviceMock} as Service;
		serviceMockWithTimeSlot.timeslotsSchedule = timeslotsScheduleMock;
		getServiceProvider.mockImplementation(() => Promise.resolve(serviceProviderMock));
		getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(serviceMockWithTimeSlot));
		getServiceProviderTimeslotsSchedule.mockImplementation(() => Promise.resolve(serviceProviderMock));
		createTimeslotsSchedule.mockImplementation(() => Promise.resolve(timeslotsScheduleMock));

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.createTimeslotItemForServiceProvider(1, req);
		expect(createTimeslotsSchedule).toBeCalled();
		expect(saveTimeslotItems).toBeCalled();
		expect(saveTimeslotItem).toBeCalled();
	});

	it('should not copy timeslots schedule item for service to  service provider', async () => {
		const req = new TimeslotItemRequest();
		req.weekDay = Weekday.Thursday;
		req.startTime = "11:00";
		req.endTime = "12:00";
		const serviceProviderWithTimeslotsScheduleMock = {...serviceProviderMock} as ServiceProvider;
		serviceProviderWithTimeslotsScheduleMock.timeslotsSchedule = timeslotsScheduleMock;
		getServiceProvider.mockImplementation(() => Promise.resolve(serviceProviderWithTimeslotsScheduleMock));
		getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(serviceMock));
		getServiceProviderTimeslotsSchedule.mockImplementation(() => Promise.resolve(serviceProviderWithTimeslotsScheduleMock));
		createTimeslotsSchedule.mockImplementation(() => Promise.resolve(timeslotsScheduleMock));

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.createTimeslotItemForServiceProvider(1, req);
		expect(createTimeslotsSchedule).toBeCalledTimes(0);
		expect(saveTimeslotItems).toBeCalledTimes(0);
		expect(saveTimeslotItem).toBeCalled();
	});

	it('should validate start time is less than end time', async () => {
		const req = new TimeslotItemRequest();
		req.weekDay = Weekday.Thursday;
		req.startTime = "08:00";
		req.endTime = "07:00";
		getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));
		getService.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await expect(() => timeslotItemsService.createTimeslotItem(1, req))
			.rejects.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Timeslot start time must be less than end time.'));
	});

	it('should validate start time / end time when creating timeslots item', async () => {
		const req = new TimeslotItemRequest();
		req.weekDay = Weekday.Thursday;
		req.startTime = "asdasd";
		req.endTime = "bbb";
		getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(serviceMock));
		getService.mockImplementation(() => Promise.resolve(serviceMock));
		createTimeslotsSchedule.mockImplementation(() => Promise.resolve(timeslotsScheduleMock));

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await expect(() => timeslotItemsService.createTimeslotItem(1, req))
			.rejects.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Value asdasd is not a valid time.'));
	});

	it('should validate overlaps', async () => {
		const req = new TimeslotItemRequest();
		req.weekDay = Weekday.Monday;
		req.startTime = "11:15";
		req.endTime = "12:15";
		getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));
		getService.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await expect(() => timeslotItemsService.createTimeslotItem(1, req))
			.rejects.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Timeslot item overlaps existing entry.'));
	});

	it('should not validate overlap when updating same item', async () => {
		const req = new TimeslotItemRequest();
		req.weekDay = Weekday.Monday;
		req.startTime = "11:15";
		req.endTime = "12:15";

		const serviceMockForUpdate = new Service();
		serviceMockForUpdate.id = 1;
		serviceMockForUpdate.name = 'service';

		const timeslotItemMockForUpdate = TimeslotItem.create(1, Weekday.Monday, TimeOfDay.create({
			hours: 11,
			minutes: 0
		}), TimeOfDay.create({hours: 11, minutes: 30}));
		timeslotItemMockForUpdate._id = 4;
		const scheduleForUpdate = new TimeslotsSchedule();
		scheduleForUpdate._id = 1;
		scheduleForUpdate.timeslotItems = [timeslotItemMockForUpdate];

		serviceMockForUpdate.timeslotsScheduleId = scheduleForUpdate._id;
		serviceMockForUpdate.timeslotsSchedule = scheduleForUpdate;

		getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(serviceMockForUpdate));

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.updateTimeslotItem({serviceId: 1, timeslotId: 4, request: req});
		expect(saveTimeslotItem).toBeCalled();
	});

	it('should not validate overlaps on different week days', async () => {
		const req = new TimeslotItemRequest();
		req.weekDay = Weekday.Tuesday;
		req.startTime = "11:15";
		req.endTime = "12:15";
		getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));
		getService.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.createTimeslotItem(1, req);
		expect(saveTimeslotItem).toHaveBeenCalled();
	});

	it('should update timeslots item', async () => {
		const req = new TimeslotItemRequest();
		req.weekDay = Weekday.Thursday;
		req.startTime = "07:00";
		req.endTime = "08:00";

		const serviceMockForUpdate = new Service();
		serviceMockForUpdate.id = 1;
		serviceMockForUpdate.name = 'service';

		const timeslotItemMockForUpdate = TimeslotItem.create(1, 1, TimeOfDay.create({
			hours: 11,
			minutes: 0
		}), TimeOfDay.create({hours: 11, minutes: 30}));
		timeslotItemMockForUpdate._id = 4;
		const scheduleForUpdate = new TimeslotsSchedule();
		scheduleForUpdate._id = 1;
		scheduleForUpdate.timeslotItems = [timeslotItemMockForUpdate];

		serviceMockForUpdate.timeslotsScheduleId = scheduleForUpdate._id;
		serviceMockForUpdate.timeslotsSchedule = scheduleForUpdate;

		getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(serviceMockForUpdate));

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.updateTimeslotItem({serviceId: 1, timeslotId: 4, request: req});
		expect(saveTimeslotItem).toBeCalled();
	});

	it('should throw when updating wrong timeslot id', async () => {
		const req = new TimeslotItemRequest();
		req.weekDay = 4;
		req.startTime = "07:00";
		req.endTime = "08:00";

		const serviceMockForUpdate = new Service();
		serviceMockForUpdate.id = 1;
		serviceMockForUpdate.name = 'service';

		const timeslotItemMockForUpdate = TimeslotItem.create(1, 1, TimeOfDay.create({
			hours: 11,
			minutes: 0
		}), TimeOfDay.create({hours: 11, minutes: 30}));
		timeslotItemMockForUpdate._id = 4;
		const scheduleForUpdate = new TimeslotsSchedule();
		scheduleForUpdate._id = 1;
		scheduleForUpdate.timeslotItems = [timeslotItemMockForUpdate];

		serviceMockForUpdate.timeslotsScheduleId = scheduleForUpdate._id;
		serviceMockForUpdate.timeslotsSchedule = scheduleForUpdate;

		getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(serviceMockForUpdate));

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await expect(() =>
			timeslotItemsService.updateTimeslotItem({serviceId: 1, timeslotId: 5, request: req}))
			.rejects.toStrictEqual(new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Timeslot item not found'));
	});

	it('should throw when id is empty', async () => {
		const timeslotItemsService = Container.get(TimeslotItemsService);
		expect(async () => await timeslotItemsService.getTimeslotItemsByServiceId(null))
			.rejects.toThrowError();
	});

	it('should throw when service is not found', async () => {
		getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(null));
		const timeslotItemsService = Container.get(TimeslotItemsService);
		expect(async () => await timeslotItemsService.getTimeslotItemsByServiceId(3))
			.rejects.toThrowError();
	});

	it('should delete timeslot item', async () => {
		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.deleteTimeslot(1);
		expect(deleteTimeslotItem).toBeCalledTimes(1);
	});
});
