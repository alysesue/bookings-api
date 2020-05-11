import TemplatesTimeslotsService from "../templatesTimeslots.service";
import { TimeslotParams } from "../templatesTimeslots.apicontract";
import { TemplatesTimeslotsRepository } from "../templatesTimeslots.repository";
import { Container } from "typescript-ioc";
import { TemplateTimeslots } from "../../../models/templateTimeslots";
import { DateHelper } from '../../../infrastructure/dateHelper';

const timeslots = new TemplateTimeslots('name', new Date(), new Date(), 5);

const getTemplateTimeslots = jest.fn().mockImplementation(() => Promise.resolve(timeslots));
const setTemplateTimeslots = jest.fn().mockImplementation(() => Promise.resolve(timeslots));

const MockTimeslotsRepository = jest.fn().mockImplementation(() => ({ getTemplateTimeslots, setTemplateTimeslots }));

describe('Timeslots  template services ', () => {
	let timeslotsService: TemplatesTimeslotsService = new TemplatesTimeslotsService();

	beforeAll(() => {
		Container.bind(TemplatesTimeslotsRepository).to(MockTimeslotsRepository);
		timeslotsService = Container.get(TemplatesTimeslotsService);
	});

	it('should return the template', async () => {
		const date = new Date();
		const template = await timeslotsService.upsertTemplateTimeslots({
			name: 'test',
			firstSlotStartTime: DateHelper.setHours(date, 9, 0),
			lastSlotEndTime: DateHelper.setHours(date, 5, 0),
			slotsDuration: 60
		} as TimeslotParams);
		expect(setTemplateTimeslots).toBeCalled();
		expect(template.name).toStrictEqual(timeslots.name);
	});
});
