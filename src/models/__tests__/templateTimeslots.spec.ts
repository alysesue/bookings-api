
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
		expect(DateHelper.getTimeString(list[0].startTime)).toBe("08:30");
		expect(DateHelper.getTimeString(list[0].endTime)).toBe("09:30");
	});

	it('should generate multiple timeslots', () => {
		const date = new Date();

		const generate = template.GenerateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 12, 0),
			endDatetime: DateHelper.setHours(date, 18, 0)
		});

		const list = Array.from(generate);

		expect(list.length).toBe(3);
	});

	it('should generate fist timeslot only when the template starts', () => {
		const date = new Date();

		const generate = template.GenerateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 6, 0),
			endDatetime: DateHelper.setHours(date, 10, 0)
		});

		const list = Array.from(generate);

		expect(list.length).toBe(1);
		expect(DateHelper.getTimeString(list[0].startTime)).toBe("08:30");
		expect(DateHelper.getTimeString(list[0].endTime)).toBe("09:30");
	});

	it('should discard last timeslot when it doesnt fit the window', () => {
		const date = new Date();

		const generate = template.GenerateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 14, 0),
			endDatetime: DateHelper.setHours(date, 18, 0)
		});

		const list = Array.from(generate);

		expect(list.length).toBe(1);
		expect(DateHelper.getTimeString(list[0].startTime)).toBe("14:30");
		expect(DateHelper.getTimeString(list[0].endTime)).toBe("15:30");
	});

	it('should generate timeslots over the next day', () => {
		const date = new Date();
		const nextDay = DateHelper.addDays(date, 1);

		const generate = template.GenerateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 14, 0),
			endDatetime: DateHelper.setHours(nextDay, 10, 0)
		});

		const list = Array.from(generate);
		expect(list.length).toBe(2);

		expect(list[0].startTime.getDate()).toBe(date.getDate());
		expect(DateHelper.getTimeString(list[0].startTime)).toBe("14:30");

		expect(list[1].startTime.getDate()).toBe(nextDay.getDate());
		expect(DateHelper.getTimeString(list[1].startTime)).toBe("08:30");
	});

	it('should generate timeslots over multiple days', () => {
		const date = new Date();
		const anotherDate = DateHelper.addDays(date, 2);

		const generate = template.GenerateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 12, 0),
			endDatetime: DateHelper.setHours(anotherDate, 11, 0)
		});

		const list = Array.from(generate);
		expect(list.length).toBe(12);

		expect(list[0].startTime.getDate()).toBe(date.getDate());
		expect(DateHelper.getTimeString(list[0].startTime)).toBe("12:30");

		for (const element of list) {
			const hours = element.startTime.getHours();
			expect(hours).toBeGreaterThanOrEqual(8);
			expect(hours).toBeLessThanOrEqual(14);
		}
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
