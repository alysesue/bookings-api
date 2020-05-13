import { Container, Snapshot } from "typescript-ioc";
import { TemplateTimeslotRequest } from "../templatesTimeslots.apicontract";
import TemplatesTimeslotsService from "../templatesTimeslots.service";
import { TemplatesTimeslotsController } from "../templatesTimeslots.controller";

const createTemplateTimeslots = jest.fn();
const updateTemplateTimeslots = jest.fn();
const deleteTemplateTimeslots = jest.fn();
const MockTemplatesTimeslotsService = jest.fn().mockImplementation(() => {
	return {createTemplateTimeslots, updateTemplateTimeslots, deleteTemplateTimeslots};
});

let snapshot: Snapshot;
beforeAll(() => {
	// Store the IoC configuration
	snapshot = Container.snapshot();

	// Clears mock counters, not implementation
	jest.clearAllMocks();
});

afterAll(() => {
	// Put the IoC configuration back for IService, so other tests can run.
	snapshot.restore();
});

beforeEach(() => {
	jest.clearAllMocks();
});

const timeslot: TemplateTimeslotRequest = new TemplateTimeslotRequest('', '', '', '', [], undefined);
describe('Test templates timeslots controller', () => {
	it('should test if creat service is called', async () => {
		Container.bind(TemplatesTimeslotsService).to(MockTemplatesTimeslotsService);
		const timeslotsController = Container.get(TemplatesTimeslotsController);

		await timeslotsController.createTemplateTimeslots(timeslot);
		expect(createTemplateTimeslots).toBeCalledTimes(1);
	});

	it('should test if upsert service is called', async () => {
		Container.bind(TemplatesTimeslotsService).to(MockTemplatesTimeslotsService);
		const timeslotsController = Container.get(TemplatesTimeslotsController);

		await timeslotsController.updateTemplateTimeslots(timeslot);
		expect(updateTemplateTimeslots).toBeCalledTimes(1);
	});

	it('should test if delete service is called', async () => {
		Container.bind(TemplatesTimeslotsService).to(MockTemplatesTimeslotsService);
		const timeslotsController = Container.get(TemplatesTimeslotsController);

		await timeslotsController.deleteTemplateTimeslots(3);
		expect(deleteTemplateTimeslots).toBeCalledTimes(1);
	});

});