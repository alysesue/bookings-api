
import { Container, Snapshot } from 'typescript-ioc';
import { TemplateTimeslots, Timeslot } from '../templateTimeslots';
import { DateHelper } from '../../infrastructure/dateHelper';

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

describe('Timeslots template', () => {
	const template = new TemplateTimeslots('test',
		new Date(2000, 1, 1, 8, 30),
		new Date(2000, 1, 1, 16, 0),
		60);

	it('should generate single timeslot', () => {
		const date = new Date();

		const generate = template.GenerateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 8, 30),
			endDatetime: DateHelper.setHours(date, 9, 30)
		});

		const list = Array.from(generate);

		expect(list.length).toBe(1);
	});

	it('should generate no timeslots', () => {
		const date = new Date();

		const generate = template.GenerateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 8, 31),
			endDatetime: DateHelper.setHours(date, 9, 30)
		});

		const list = Array.from(generate);

		expect(list.length).toBe(0);
	});
});
