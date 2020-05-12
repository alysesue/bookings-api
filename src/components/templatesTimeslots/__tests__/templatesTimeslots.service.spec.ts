import TemplatesTimeslotsService from "../templatesTimeslots.service";
import { TimeslotParams } from "../templatesTimeslots.apicontract";
import TemplatesTimeslotsRepository from "../templatesTimeslots.repository";
import { Container } from "typescript-ioc";
import { TemplateTimeslots } from "../../../models/templateTimeslots";

const timeslots = new TemplateTimeslots('name', new Date(), new Date(), 5);
const getTemplateTimeslotsByName = jest.fn().mockImplementation(() => Promise.resolve(undefined));
const setTemplateTimeslots = jest.fn().mockImplementation(() => Promise.resolve(timeslots));
const MockTimeslotsRepository = jest.fn().mockImplementation(() => ({setTemplateTimeslots, getTemplateTimeslotsByName}));

describe('Timeslots  template services ', () => {
	let  timeslotsService;
	beforeAll(() => {
		Container.bind(TemplatesTimeslotsRepository).to(MockTimeslotsRepository);
		timeslotsService = Container.get(TemplatesTimeslotsService);
	});

	it('should return the template', async () => {
		const template = await timeslotsService.upsertTemplateTimeslots(new TimeslotParams());
		expect(getTemplateTimeslotsByName).toBeCalledTimes(1);
		expect(setTemplateTimeslots).toBeCalledTimes(1);
		expect(template.name).toStrictEqual(timeslots.name);
	});
});