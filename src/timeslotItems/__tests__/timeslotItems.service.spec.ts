import { Container } from "typescript-ioc";
import { Service, TimeOfDay, TimeslotItem, TimeslotsSchedule } from "../../models";
import { TimeslotItemsService } from "../timeslotItems.service";
import { TimeslotsScheduleRepository } from "../timeslotsSchedule.repository";
import { ServicesRepository } from "../../services/services.repository";
import { TimeslotItemRequest } from "../timeslotItems.apicontract";
import { TimeslotItemsRepository } from "../timeslotItems.repository";

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

describe('TimeslotsSchedule template services ', () => {
	let timeslotItemsService: TimeslotItemsService;
	beforeAll(() => {
		Container.bind(TimeslotsScheduleRepository).to(MockTimeslotsScheduleRepository);
		Container.bind(TimeslotItemsRepository).to(MockTimeslotItemsRepository);
		Container.bind(ServicesRepository).to(MockServicesRepository);
		timeslotItemsService = Container.get(TimeslotItemsService);
	});
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should get timeslots schedule', async () => {
		await timeslotItemsService.getTimeslotItemsByServiceId(1);
		expect(getTimeslotsScheduleById).toBeCalled();
	});

	it('should create timeslots item', async () => {
		const req = new TimeslotItemRequest();
		req.weekDay = 4;
		req.startTime = "07:00";
		await timeslotItemsService.createTimeslotItem(1, req);
		expect(createTimeslotsSchedule).toBeCalled();
	});

});
