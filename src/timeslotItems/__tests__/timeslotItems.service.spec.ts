import { Container } from "typescript-ioc";
import { Service, TimeOfDay, TimeslotItem, TimeslotsSchedule } from "../../models";
import { TimeslotItemsService } from "../timeslotItems.service";
import { TimeslotsScheduleRepository } from "../timeslotsSchedule.repository";
import { ServicesRepository } from "../../services/services.repository";

const timeslotsScheduleMock = new TimeslotsSchedule();
timeslotsScheduleMock._id = 1;
timeslotsScheduleMock.timeslotItems = [TimeslotItem.create(1, 1, TimeOfDay.create({ hours: 11, minutes: 0 }), TimeOfDay.create({ hours: 11, minutes: 30 }))];

const getTimeslotsScheduleById = jest.fn().mockImplementation(() => Promise.resolve(timeslotsScheduleMock));
const MockTimeslotsScheduleRepository = jest.fn().mockImplementation(() => ({
	getTimeslotsScheduleById,
}));

const serviceMock = new Service();
serviceMock.id = 1;
serviceMock.name = 'service';
const getService = jest.fn().mockImplementation(() => Promise.resolve(serviceMock));
const MockServicesRepository = jest.fn().mockImplementation(() => ({
	getService,
}));

describe('Schedules  template services ', () => {
	let timeslotItemsService: TimeslotItemsService;
	beforeAll(() => {
		Container.bind(TimeslotsScheduleRepository).to(MockTimeslotsScheduleRepository);
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

});
