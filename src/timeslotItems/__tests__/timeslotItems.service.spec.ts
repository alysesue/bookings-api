import { Container } from "typescript-ioc";
import { Service, ServiceProvider, TimeOfDay, TimeslotItem, TimeslotsSchedule } from "../../models";
import { TimeslotItemsService } from "../timeslotItems.service";
import { TimeslotsScheduleRepository } from "../timeslotsSchedule.repository";
import { ServicesRepository } from "../../services/services.repository";
import { TimeslotItemRequest } from "../timeslotItems.apicontract";
import { TimeslotItemsRepository } from "../timeslotItems.repository";
import { ServiceProvidersRepository } from "../../serviceProviders/serviceProviders.repository";

const timeslotItemMock = TimeslotItem.create(1, 1, TimeOfDay.create({ hours: 11, minutes: 0 }), TimeOfDay.create({ hours: 11, minutes: 30 }));
const timeslotsScheduleMock = new TimeslotsSchedule();
timeslotsScheduleMock._id = 1;
timeslotsScheduleMock.timeslotItems = [timeslotItemMock];

const getTimeslotsScheduleById = jest.fn().mockImplementation(() => Promise.resolve(timeslotsScheduleMock));
const createTimeslotsSchedule = jest.fn().mockImplementation(() => Promise.resolve(timeslotsScheduleMock));
const MockTimeslotsScheduleRepository = jest.fn().mockImplementation(() => ({
	getTimeslotsScheduleById,
	createTimeslotsSchedule,
}));

const createTimeslotItem = jest.fn().mockImplementation(() => Promise.resolve(timeslotItemMock));
const saveTimeslotItem = jest.fn().mockImplementation(() => Promise.resolve(timeslotItemMock));
const MockTimeslotItemsRepository = jest.fn().mockImplementation(() => ({
	createTimeslotItem,
	saveTimeslotItem
}));

const serviceMock = new Service();
serviceMock.id = 1;
serviceMock.name = 'service';
const getService = jest.fn().mockImplementation(() => Promise.resolve(serviceMock));
const save = jest.fn().mockImplementation(() => Promise.resolve(serviceMock));
const MockServicesRepository = jest.fn().mockImplementation(() => ({
	getService,
	save
}));

const serviceProvider = new ServiceProvider();
const getServiceProvider = jest.fn().mockImplementation(() => Promise.resolve(serviceProvider));
const MockServiceProvidersRepository = jest.fn().mockImplementation(() => ({
	getServiceProvider
}));

describe('TimeslotsSchedule template services ', () => {
	beforeAll(() => {
		Container.bind(TimeslotsScheduleRepository).to(MockTimeslotsScheduleRepository);
		Container.bind(TimeslotItemsRepository).to(MockTimeslotItemsRepository);
		Container.bind(ServicesRepository).to(MockServicesRepository);
		Container.bind(ServiceProvidersRepository).to(MockServiceProvidersRepository);
	});
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should get timeslots schedule', async () => {
		getService.mockImplementation(() => Promise.resolve(serviceMock));

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.getTimeslotItemsByServiceId(1);
		expect(getTimeslotsScheduleById).toBeCalled();
	});

	it('should get service provider timeslots schedule', async () => {
		const timeslotItemsService = Container.get(TimeslotItemsService);
		const result = await timeslotItemsService.getTimeslotItemsByServiceProvider(1);
		expect(result.timeslots).toEqual([
			{
				"endTime": "11:30",
				"startTime": "11:00",
				"weekDay": 1
			}
		]);
		expect(getTimeslotsScheduleById).toBeCalledWith(serviceProvider.timeslotsScheduleId);
	});

	it('should get service timeslots schedule where service provider does not have one', async () => {
		serviceProvider.timeslotsScheduleId = null;
		getServiceProvider.mockImplementation(() => Promise.resolve(serviceProvider));
		const timeslotItemsService = Container.get(TimeslotItemsService);
		const result = await timeslotItemsService.getTimeslotItemsByServiceProvider(1);
		expect(result.timeslots).toEqual([
			{
				"endTime": "11:30",
				"startTime": "11:00",
				"weekDay": 1
			}
		]);
		expect(getTimeslotsScheduleById).toBeCalledWith(serviceMock.timeslotsScheduleId);
		expect(getTimeslotsScheduleById).not.toHaveBeenCalledWith(serviceProvider.timeslotsScheduleId);
	});

	it('should create timeslots item', async () => {
		const req = new TimeslotItemRequest();
		req.weekDay = 4;
		req.startTime = "07:00";

		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.createTimeslotItem(1, req);
		expect(createTimeslotsSchedule).toBeCalled();
	});

	it('should throw when id is empty', async () => {
		const timeslotItemsService = Container.get(TimeslotItemsService);
		expect(async () => await timeslotItemsService.getTimeslotItemsByServiceId(null))
			.rejects.toThrowError();
	});

	it('should throw when service is not found', async () => {
		getService.mockImplementation(() => Promise.resolve(null));
		const timeslotItemsService = Container.get(TimeslotItemsService);
		expect(async () => await timeslotItemsService.getTimeslotItemsByServiceId(3))
			.rejects.toThrowError();
	});
});
