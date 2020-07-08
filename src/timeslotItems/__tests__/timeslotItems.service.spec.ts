import { Container } from "typescript-ioc";
import { TimeOfDay, TimeslotItem, TimeslotsSchedule } from "../../models";
import { TimeslotItemsService } from "../timeslotItems.service";
import { TimeslotItemsRepository } from "../timeslotItems.repository";

const timeslotsScheduleMock = new TimeslotsSchedule();
timeslotsScheduleMock._timeslotsScheduleId = 1;
timeslotsScheduleMock.timeslotItems = [TimeslotItem.create(1, 1, TimeOfDay.create({ hours: 11, minutes: 0 }), TimeOfDay.create({ hours: 11, minutes: 30 }))];

const getTimeslotsScheduleById = jest.fn().mockImplementation(() => Promise.resolve(timeslotsScheduleMock));
const MockTimeslotsScheduleRepository = jest.fn().mockImplementation(() => ({
	getTimeslotsScheduleById,
}));

describe('Schedules  template services ', () => {
	let timeslotItemsService: TimeslotItemsService;
	beforeAll(() => {
		Container.bind(TimeslotItemsRepository).to(MockTimeslotsScheduleRepository);
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
