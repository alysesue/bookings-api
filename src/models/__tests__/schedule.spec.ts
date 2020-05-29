
import { Container, Snapshot } from 'typescript-ioc';
import { Schedule, WeekDaySchedule } from '../index';
import { Timeslot } from '../timeslot';
import { DateHelper } from '../../infrastructure/dateHelper';
import { Weekday } from '../../enums/weekday';
import { TimeOfDay } from '../timeOfDay';

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

function createDayOfWeekTemplate(weekday: Weekday, openTime: string, closeTime: string, schedule: Schedule): WeekDaySchedule {
	const weekDaySchedule = WeekDaySchedule.create(weekday, schedule);
	weekDaySchedule.hasSchedule = true;
	weekDaySchedule.openTime = TimeOfDay.parse(openTime);
	weekDaySchedule.closeTime = TimeOfDay.parse(closeTime);
	return weekDaySchedule;
}

describe('Timeslots template', () => {
	const template = new Schedule();
	template.name = 'test';
	template.slotsDurationInMin = 60;
	template.weekdaySchedules = [
		WeekDaySchedule.create(Weekday.Sunday, template),
		createDayOfWeekTemplate(Weekday.Monday, '08:30', '16:00', template),
		createDayOfWeekTemplate(Weekday.Tuesday, '08:30', '15:00', template),
		createDayOfWeekTemplate(Weekday.Wednesday, '09:30', '16:00', template),
		WeekDaySchedule.create(Weekday.Thursday, template),
		WeekDaySchedule.create(Weekday.Friday, template),
		WeekDaySchedule.create(Weekday.Saturday, template)
	];

	const date = new Date(2020, 4, 12); // May 12th -  Tuesday;

	it('should generate single timeslot', () => {
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
		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 12, 0),
			endDatetime: DateHelper.setHours(date, 18, 0)
		});

		const list = Array.from(generate);

		expect(list.length).toBe(2);
	});

	it('should generate fist timeslot only when the template starts', () => {
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
		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 13, 0),
			endDatetime: DateHelper.setHours(date, 18, 0)
		});

		const list = Array.from(generate);

		expect(list.length).toBe(1);
		expect(DateHelper.getTimeString(list[0].getStartTime())).toBe("13:30");
		expect(DateHelper.getTimeString(list[0].getEndTime())).toBe("14:30");
	});

	it('should generate timeslots over the next day', () => {
		const nextDay = DateHelper.addDays(date, 1);

		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 13, 0),
			endDatetime: DateHelper.setHours(nextDay, 11, 0)
		});

		const list = Array.from(generate);
		expect(list.length).toBe(2);

		expect(list[0].getStartTime().getDate()).toBe(date.getDate());
		expect(DateHelper.getTimeString(list[0].getStartTime())).toBe("13:30");

		expect(list[1].getStartTime().getDate()).toBe(nextDay.getDate());
		expect(DateHelper.getTimeString(list[1].getStartTime())).toBe("09:30");
	});

	it('should generate timeslots over multiple days', () => {
		const anotherDate = DateHelper.addDays(date, 2);

		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 12, 0),
			endDatetime: DateHelper.setHours(anotherDate, 12, 0)
		});

		const list = Array.from(generate);
		expect(list.length).toBe(8); // Thursday is not a work day

		expect(list[0].getStartTime().getDate()).toBe(date.getDate());
		expect(DateHelper.getTimeString(list[0].getStartTime())).toBe("12:30");

		for (const element of list) {
			const hours = element.getStartTime().getHours();
			expect(hours).toBeGreaterThanOrEqual(8);
			expect(hours).toBeLessThanOrEqual(14);
		}
	});

	it('should generate no timeslots', () => {
		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 8, 31),
			endDatetime: DateHelper.setHours(date, 9, 30)
		});

		const list = Array.from(generate);

		expect(list.length).toBe(0);
	});
});
