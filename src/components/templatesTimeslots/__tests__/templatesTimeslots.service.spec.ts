import TemplatesTimeslotsService from "../templatesTimeslots.service";
import { TemplateTimeslotRequest } from "../templatesTimeslots.apicontract";
import { TemplatesTimeslotsRepository } from "../templatesTimeslots.repository";
import { Container } from "typescript-ioc";
import { TemplateTimeslots } from "../../../models/templateTimeslots";

const timeslotsRequestCommon: TemplateTimeslotRequest = new TemplateTimeslotRequest('name', '11:23', '12:23', 65, []);
const timeslots: TemplateTimeslots = new TemplateTimeslots();
timeslots.mapTemplateTimeslotRequest(timeslotsRequestCommon);

const getTemplateTimeslotsByName = jest.fn().mockImplementation(() => Promise.resolve(timeslots));
const setTemplateTimeslots = jest.fn().mockImplementation(() => Promise.resolve(timeslots));
const deleteTemplateTimeslots = jest.fn().mockImplementation(() => Promise.resolve(undefined));
const MockTimeslotsRepository = jest.fn().mockImplementation(() => ({
	setTemplateTimeslots,
	getTemplateTimeslotsByName,
	deleteTemplateTimeslots
}));

describe('Timeslots  template services ', () => {
	let timeslotsService: TemplatesTimeslotsService;
	beforeAll(() => {
		Container.bind(TemplatesTimeslotsRepository).to(MockTimeslotsRepository);
		timeslotsService = Container.get(TemplatesTimeslotsService);
	});
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should throw error because firstSlotStartTimeInHHmm have wrong format', async () => {
		const timeslotsRequest: TemplateTimeslotRequest = new TemplateTimeslotRequest('name', '2323', '11:23', 5, []);
		try {
			await timeslotsService.createTemplateTimeslots(timeslotsRequest);
		} catch (e) {
			expect(e.message).toBe("Not valid format for firstSlotStartTimeInHHmm: 2323");
		}
		expect(setTemplateTimeslots).toBeCalledTimes(0);
	});

	it('should throw error because lastSlotEndTimeInHHmm have wrong format', async () => {
		const timeslotsRequest: TemplateTimeslotRequest = new TemplateTimeslotRequest('name', '23:23', '11:73', 5, []);
		try {
			await timeslotsService.createTemplateTimeslots(timeslotsRequest);
		} catch (e) {
			expect(e.message).toBe("Not valid format for lastSlotEndTimeInHHmm: 11:73");
		}
		expect(setTemplateTimeslots).toBeCalledTimes(0);
	});

	it('should throw error because firstSlotStartTimeInHHmm > lastSlotEndTimeInHHmm', async () => {
		const timeslotsRequest: TemplateTimeslotRequest = new TemplateTimeslotRequest('name', '23:23', '11:23', 5, []);
		try {
			await timeslotsService.createTemplateTimeslots(timeslotsRequest);
		} catch (e) {
			expect(e.message).toBe("firstSlotStartTimeInHHmm=23:23 > lastSlotEndTimeInHHmm=11:23");
		}
		expect(setTemplateTimeslots).toBeCalledTimes(0);

	});

	it('should throw error because slotsDurationInMin < lastSlotEndTimeInHHmm - firstSlotStartTimeInHHmm ', async () => {
		const timeslotsRequest: TemplateTimeslotRequest = new TemplateTimeslotRequest('name', '11:23', '12:23', 65, []);
		try {
			await timeslotsService.createTemplateTimeslots(timeslotsRequest);
		} catch (e) {
			expect(e.message).toBe("slotsDurationInMin=65 < (lastSlotEndTimeInHHmm-firstSlotStartTimeInHHmm)=60");
		}
		expect(setTemplateTimeslots).toBeCalledTimes(0);

	});

	it('should create new templateTimeslots ', async () => {
		const timeslotsRequest: TemplateTimeslotRequest = new TemplateTimeslotRequest('name', '11:23', '12:23', 60, []);
		await timeslotsService.createTemplateTimeslots(timeslotsRequest);
		expect(setTemplateTimeslots).toBeCalledTimes(1);
	});

	it('should update the template', async () => {
		const template = await timeslotsService.updateTemplateTimeslots(timeslotsRequestCommon);
		timeslots.mapTemplateTimeslotRequest(timeslotsRequestCommon);
		expect(setTemplateTimeslots).toBeCalled();
		expect(getTemplateTimeslotsByName).toBeCalled();
		expect(template.name).toStrictEqual(timeslots.name);
	});

	it('should call delete repository', async () => {
		await timeslotsService.deleteTemplateTimeslots(3);
		expect(deleteTemplateTimeslots).toBeCalled();
	});

});
