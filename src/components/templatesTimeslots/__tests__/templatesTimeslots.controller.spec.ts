import { Container, Snapshot } from "typescript-ioc";
import { TimeslotParams } from "../templatesTimeslots.apicontract";
import TemplatesTimeslotsService from "../templatesTimeslots.service";
import { TemplatesTimeslotsController } from "../templatesTimeslots.controller";

const upsertTemplateTimeslots = jest.fn();
const deleteTemplateTimeslots = jest.fn();
const MockTemplatesTimeslotsService = jest.fn().mockImplementation(() => {
	return {upsertTemplateTimeslots, deleteTemplateTimeslots};
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

describe('Test templates timeslots controller', () => {
	it('should test if upsert service is called', async () => {
		const timeslot: TimeslotParams = new TimeslotParams();
		Container.bind(TemplatesTimeslotsService).to(MockTemplatesTimeslotsService);
		const timeslotsController = Container.get(TemplatesTimeslotsController);

		await timeslotsController.upsertTemplateTimeslots(timeslot);
		expect(upsertTemplateTimeslots).toBeCalledTimes(1);
	});
	it('should test if delete service is called', async () => {
		Container.bind(TemplatesTimeslotsService).to(MockTemplatesTimeslotsService);
		const timeslotsController = Container.get(TemplatesTimeslotsController);

		await timeslotsController.deleteTemplateTimeslots(3);
		expect(deleteTemplateTimeslots).toBeCalledTimes(1);
	});
});