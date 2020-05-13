import TemplatesTimeslotsService from "../templatesTimeslots.service";
import { TemplateTimeslotRequest } from "../templatesTimeslots.apicontract";
import { TemplatesTimeslotsRepository } from "../templatesTimeslots.repository";
import { Container } from "typescript-ioc";
import { TemplateTimeslots } from "../../../models";

const timeslotsRequest : TemplateTimeslotRequest = new TemplateTimeslotRequest('name', '23:23', '11:23', 5, [], undefined);
const timeslots : TemplateTimeslots = new TemplateTimeslots();

const getTemplateTimeslotsByName = jest.fn().mockImplementation(() => Promise.resolve(undefined));
const setTemplateTimeslots = jest.fn().mockImplementation(() => Promise.resolve(timeslots));
const MockTimeslotsRepository = jest.fn().mockImplementation(() => ({
	setTemplateTimeslots,
	getTemplateTimeslotsByName
}));

describe('Timeslots  template services ', () => {
	let timeslotsService;
	beforeAll(() => {
		Container.bind(TemplatesTimeslotsRepository).to(MockTimeslotsRepository);
		timeslotsService = Container.get(TemplatesTimeslotsService);
	});
	beforeEach(()=>{
		jest.clearAllMocks();
	});

	it('should call creat timelots', async () => {
		const template = await timeslotsService.createTemplateTimeslots(timeslotsRequest);
		expect(setTemplateTimeslots).toBeCalled();
	});

	// it('should return the template', async () => {
	// 	const template = await timeslotsService.upsertTemplateTimeslots(timeslotsRequest);
	// 	timeslots.mapTemplateTimeslotRequest(timeslotsRequest);
	// 	expect(setTemplateTimeslots).toBeCalled();
	// 	expect(getTemplateTimeslotsByName).toBeCalled();
	// 	expect(template.name).toStrictEqual(timeslots.name);
	// });

});