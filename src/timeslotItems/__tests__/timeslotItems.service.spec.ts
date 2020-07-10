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

const getServiceWithTimeslotsSchedule = jest.fn();
const getService = jest.fn();
const save = jest.fn().mockImplementation((param) => Promise.resolve(param));
const MockServicesRepository = jest.fn().mockImplementation(() => ({
	getService,
	getServiceWithTimeslotsSchedule,
	save
}));

describe('TimeslotsSchedule template services ', () => {
	beforeAll(() => {
		Container.bind(TimeslotsScheduleRepository).to(MockTimeslotsScheduleRepository);
		Container.bind(TimeslotItemsRepository).to(MockTimeslotItemsRepository);
		Container.bind(ServicesRepository).to(MockServicesRepository);
	});
	afterEach(() => {
		jest.clearAllMocks();
	});

	const serviceMock = new Service();
	serviceMock.id = 1;
	serviceMock.name = 'service';

	const serviceMockWithTemplate = new Service();
	serviceMockWithTemplate.id = 1;
	serviceMockWithTemplate.name = 'service';
	serviceMockWithTemplate.timeslotsScheduleId = timeslotsScheduleMock._id;
	serviceMockWithTemplate.timeslotsSchedule = timeslotsScheduleMock;

	it('should get timeslots schedule', async () => {
		getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(serviceMockWithTemplate));
		const timeslotItemsService = Container.get(TimeslotItemsService);
		await timeslotItemsService.getTimeslotItemsByServiceId(1);
		expect(getServiceWithTimeslotsSchedule).toBeCalled();
	});

	it('should create timeslots item', async () => {
		const req = new TimeslotItemRequest();
		req.weekDay = 4;
		req.startTime = "07:00";
		getService.mockImplementation(() => Promise.resolve(serviceMock));

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
		getServiceWithTimeslotsSchedule.mockImplementation(() => Promise.resolve(null));
		const timeslotItemsService = Container.get(TimeslotItemsService);
		expect(async () => await timeslotItemsService.getTimeslotItemsByServiceId(3))
			.rejects.toThrowError();
	});
});
