
import { Container, Snapshot } from 'typescript-ioc';
import { TemplateTimeslots } from '../templateTimeslots';
import { Timeslot } from '../Timeslot';
import { DateHelper } from '../../infrastructure/dateHelper';
import { Weekday } from '../../enums/weekday';

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
	const template = new TemplateTimeslots();
	template.mapTemplateTimeslotRequest({
		name: 'test',
		firstSlotStartTimeInHHmm: '08:30',
		lastSlotEndTimeInHHmm: '16:00',
		slotsDurationInMin: 60,
		weekdays: [Weekday.Monday, Weekday.Tuesday, Weekday.Wednesday, Weekday.Thursday, Weekday.Friday]
	});

	it('should generate single timeslot', () => {
		const date = new Date();

		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 8, 30),
			endDatetime: DateHelper.setHours(date, 9, 30)
		});

		const list = Array.from(generate);

		expect(list.length).toBe(1);
		expect(DateHelper.getTimeString(list[0].getStartTime())).toBe("08:30");
		expect(DateHelper.getTimeString(list[0].getEndTime())).toBe("09:30");
	});

	it('should generate multiple timeslots', () => {
		const date = new Date();

		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 12, 0),
			endDatetime: DateHelper.setHours(date, 18, 0)
		});

		const list = Array.from(generate);

		expect(list.length).toBe(3);
	});

	it('should generate fist timeslot only when the template starts', () => {
		const date = new Date();

		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 6, 0),
			endDatetime: DateHelper.setHours(date, 10, 0)
		});

		const list = Array.from(generate);

		expect(list.length).toBe(1);
		expect(DateHelper.getTimeString(list[0].getStartTime())).toBe("08:30");
		expect(DateHelper.getTimeString(list[0].getEndTime())).toBe("09:30");
	});

	it('should discard last timeslot when it doesnt fit the window', () => {
		const date = new Date();

		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 14, 0),
			endDatetime: DateHelper.setHours(date, 18, 0)
		});

		const list = Array.from(generate);

		expect(list.length).toBe(1);
		expect(DateHelper.getTimeString(list[0].getStartTime())).toBe("14:30");
		expect(DateHelper.getTimeString(list[0].getEndTime())).toBe("15:30");
	});

	it('should generate timeslots over the next day', () => {
		const date = new Date();
		const nextDay = DateHelper.addDays(date, 1);

		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 14, 0),
			endDatetime: DateHelper.setHours(nextDay, 10, 0)
		});

		const list = Array.from(generate);
		expect(list.length).toBe(2);

		expect(list[0].getStartTime().getDate()).toBe(date.getDate());
		expect(DateHelper.getTimeString(list[0].getStartTime())).toBe("14:30");

		expect(list[1].getStartTime().getDate()).toBe(nextDay.getDate());
		expect(DateHelper.getTimeString(list[1].getStartTime())).toBe("08:30");
	});

	it('should generate timeslots over multiple days', () => {
		const date = new Date();
		const anotherDate = DateHelper.addDays(date, 2);

		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 12, 0),
			endDatetime: DateHelper.setHours(anotherDate, 11, 0)
		});

		const list = Array.from(generate);
		expect(list.length).toBe(12);

		expect(list[0].getStartTime().getDate()).toBe(date.getDate());
		expect(DateHelper.getTimeString(list[0].getStartTime())).toBe("12:30");

		for (const element of list) {
			const hours = element.getStartTime().getHours();
			expect(hours).toBeGreaterThanOrEqual(8);
			expect(hours).toBeLessThanOrEqual(14);
		}
	});

	it('should generate no timeslots', () => {
		const date = new Date();

		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 8, 31),
			endDatetime: DateHelper.setHours(date, 9, 30)
		});

		const list = Array.from(generate);

		expect(list.length).toBe(0);
	});
});
