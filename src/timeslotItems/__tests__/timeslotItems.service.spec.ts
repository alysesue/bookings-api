import { Container } from "typescript-ioc";
import { Service, TimeOfDay, TimeslotItem, TimeslotsSchedule } from "../../models";
import { TimeslotItemsService } from "../timeslotItems.service";
import { TimeslotItemsRepository } from "../timeslotItems.repository";
import { ServicesRepository } from "../../services/services.repository";

const timeslotsScheduleMock = new TimeslotsSchedule();
timeslotsScheduleMock._id = 1;
timeslotsScheduleMock.timeslotItems = [TimeslotItem.create(1, 1, TimeOfDay.create({ hours: 11, minutes: 0 }), TimeOfDay.create({ hours: 11, minutes: 30 }))];

const getTimeslotsScheduleById = jest.fn().mockImplementation(() => Promise.resolve(timeslotsScheduleMock));
const MockTimeslotsScheduleRepository = jest.fn().mockImplementation(() => ({
	getTimeslotsScheduleById,
}));

const getService = jest.fn();
const MockServicesRepository = jest.fn().mockImplementation(() => ({
	getService,
}));

describe('Schedules  template services ', () => {
	let timeslotItemsService: TimeslotItemsService;
	beforeAll(() => {
		Container.bind(TimeslotItemsRepository).to(MockTimeslotsScheduleRepository);
		Container.bind(ServicesRepository).to(MockServicesRepository);
		timeslotItemsService = Container.get(TimeslotItemsService);
	});
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should get timeslots schedule', async () => {
		const serviceMock = new Service();
		serviceMock.id = 1;
		serviceMock.name = 'service';

		getService.mockImplementation(() => Promise.resolve(serviceMock));
		await timeslotItemsService.getTimeslotItemsByServiceId(1);
		expect(getTimeslotsScheduleById).toBeCalled();
	});

	it('should throw when id is empty', async () => {
		expect(async () => await timeslotItemsService.getTimeslotItemsByServiceId(null))
			.rejects.toThrowError();
	});

	it('should throw when service is not found', async () => {
		getService.mockImplementation(() => Promise.resolve(null));
		expect(async () => await timeslotItemsService.getTimeslotItemsByServiceId(3))
			.rejects.toThrowError();
	});

});
