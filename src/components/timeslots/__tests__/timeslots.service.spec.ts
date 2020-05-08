import TimeslotsService from "../timeslots.service";
import { TimeslotParams } from "../timeslots.apicontract";
import TimeslotsRepository from "../timeslots.repository";
import { Container } from "typescript-ioc";
import { Timeslot } from "../../../models/timeslot";

const timeslots = new Timeslot('name', new Date(), new Date(), 5);
const addTemplateTimeslots = jest.fn().mockImplementation(() => Promise.resolve(timeslots));

const MockTimeslotsRepository = jest.fn().mockImplementation(() => ({addTemplateTimeslots}));

describe('Timeslots  template services ', () => {
	let timeslotsService: TimeslotsService = new TimeslotsService();

	beforeAll(() => {
		Container.bind(TimeslotsRepository).to(MockTimeslotsRepository);
		timeslotsService = Container.get(TimeslotsService);
	});

	it('should return the template', async () => {
		const template = await timeslotsService.addTemplateTimeslots(new TimeslotParams());
		expect(addTemplateTimeslots).toBeCalled();
		expect(template.name).toStrictEqual(timeslots.name);
	});
});