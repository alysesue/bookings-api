import { Container } from "typescript-ioc";
import { NewTimeslot, TimeslotsSchedule, TimeOfDay } from "../../models";
import { Weekday } from "../../enums/weekday";
import { TimeslotsSchedulesService } from "../timeslotsSchedule.service";
import { TimeslotsScheduleRepository } from "../timeslotsSchedule.repository";

const timeslotsScheduleMock = new TimeslotsSchedule();
timeslotsScheduleMock._timeslotsScheduleId = 1;
timeslotsScheduleMock.timeslot = [NewTimeslot.create(1, 1, TimeOfDay.create({ hours: 11, minutes: 0 }), TimeOfDay.create({ hours: 11, minutes: 30 }))]

const getTimeslotsScheduleById = jest.fn().mockImplementation(() => Promise.resolve(timeslotsScheduleMock));
const MockTimeslotsScheduleRepository = jest.fn().mockImplementation(() => ({
	getTimeslotsScheduleById,
}));

describe('Schedules  template services ', () => {
	let timeslotScheduleService: TimeslotsSchedulesService;
	beforeAll(() => {
		Container.bind(TimeslotsScheduleRepository).to(MockTimeslotsScheduleRepository);
		timeslotScheduleService = Container.get(TimeslotsSchedulesService);
	});
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should get timeslots schedule', async () => {
		await timeslotScheduleService.getTimeslotsScheduleById(1);
		expect(getTimeslotsScheduleById).toBeCalled();
	});

});
