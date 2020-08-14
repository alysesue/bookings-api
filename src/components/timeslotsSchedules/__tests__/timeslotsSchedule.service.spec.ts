import { Container } from "typescript-ioc";
import { TimeslotsSchedule } from "../../../models";
import { TimeslotsScheduleRepository } from "../timeslotsSchedule.repository";
import { TimeslotsScheduleService } from "../timeslotsSchedule.service";

const createTimeslotsSchedule = jest.fn();
const getTimeslotsScheduleById = jest.fn();
const MockTimeslotsScheduleRepository = jest.fn().mockImplementation(() => ({
	createTimeslotsSchedule,
	getTimeslotsScheduleById
}));


describe('TimeslotsSchedule template services ', () => {
	const timeslotsScheduleMock = new TimeslotsSchedule();

	beforeAll(() => {
		Container.bind(TimeslotsScheduleRepository).to(MockTimeslotsScheduleRepository);
	});
	beforeEach(() => {
		timeslotsScheduleMock._id = 1;

	});

	afterEach(() => {
		jest.clearAllMocks();
	});


	it('should get timeslots schedule', async () => {
		getTimeslotsScheduleById.mockImplementation(() => Promise.resolve(timeslotsScheduleMock));
		const timeslotsScheduleService = Container.get(TimeslotsScheduleService);
		await timeslotsScheduleService.getTimeslotsScheduleById(1);
		expect(getTimeslotsScheduleById).toBeCalled();
	});

});
