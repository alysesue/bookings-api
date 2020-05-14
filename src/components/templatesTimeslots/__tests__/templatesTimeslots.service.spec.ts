import TemplatesTimeslotsService from "../templatesTimeslots.service";
import { TemplateTimeslotRequest } from "../templatesTimeslots.apicontract";
import { TemplatesTimeslotsRepository } from "../templatesTimeslots.repository";
import { Container } from "typescript-ioc";
import { TemplateTimeslots } from "../../../models/templateTimeslots";

const timeslotsRequestCommon: TemplateTimeslotRequest = new TemplateTimeslotRequest('name', '11:23', '12:23', 60, []);
const timeslotsCommon: TemplateTimeslots = TemplateTimeslots.mapTemplateTimeslotRequest(timeslotsRequestCommon);

const getTemplateTimeslotsByName = jest.fn().mockImplementation(() => Promise.resolve(timeslotsCommon));
const setTemplateTimeslots = jest.fn().mockImplementation(() => Promise.resolve(timeslotsCommon));
const deleteTemplateTimeslots = jest.fn().mockImplementation(() => Promise.resolve(undefined));
const MockTimeslotsRepository = jest.fn().mockImplementation(() => ({
	setTemplateTimeslots,
	getTemplateTimeslotsByName,
	deleteTemplateTimeslots
}));

describe('Timeslots  template services ', () => {
	let timeslotsService;
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

	it('should throw error because firstSlotEndTimeInHHmm have wrong format', async () => {
		const timeslotsRequest: TemplateTimeslotRequest = new TemplateTimeslotRequest('name', '23:23', '11:73', 5, []);
		try {
			await timeslotsService.createTemplateTimeslots(timeslotsRequest);
		} catch (e) {
			expect(e.message).toBe("Not valid format for firstSlotEndTimeInHHmm: 11:73");
		}
		expect(setTemplateTimeslots).toBeCalledTimes(0);
	});

	it('should throw error because firstSlotStartTimeInHHmm > firstSlotEndTimeInHHmm', async () => {
		const timeslotsRequest: TemplateTimeslotRequest = new TemplateTimeslotRequest('name', '23:23', '11:23', 5, []);
		try {
			await timeslotsService.createTemplateTimeslots(timeslotsRequest);
		} catch (e) {
			expect(e.message).toBe("firstSlotStartTimeInHHmm=23:23 > firstSlotEndTimeInHHmm=11:23");
		}
		expect(setTemplateTimeslots).toBeCalledTimes(0);

	});

	it('should throw error because slotsDurationInMin < firstSlotEndTimeInHHmm - firstSlotStartTimeInHHmm ', async () => {
		const timeslotsRequest: TemplateTimeslotRequest = new TemplateTimeslotRequest('name', '11:23', '12:23', 65, []);
		try {
			await timeslotsService.createTemplateTimeslots(timeslotsRequest);
		} catch (e) {
			expect(e.message).toBe("slotsDurationInMin=65 < (firstSlotEndTimeInHHmm-firstSlotStartTimeInHHmm)=60");
		}
		expect(setTemplateTimeslots).toBeCalledTimes(0);

	});

	it('should create new templateTimeslots ', async () => {
		await timeslotsService.createTemplateTimeslots(timeslotsRequestCommon);
		expect(setTemplateTimeslots).toBeCalledTimes(1);
	});

	it('should update the template', async () => {
		const template = await timeslotsService.updateTemplateTimeslots(timeslotsRequestCommon);
		const timeslots = TemplateTimeslots.mapTemplateTimeslotRequest(timeslotsRequestCommon);
		expect(setTemplateTimeslots).toBeCalled();
		expect(getTemplateTimeslotsByName).toBeCalled();
		expect(template.name).toStrictEqual(timeslots.name);
	});

	it('should call delete repository', async () => {
		await timeslotsService.deleteTemplateTimeslots(3);
		expect(deleteTemplateTimeslots).toBeCalled();
	});

});