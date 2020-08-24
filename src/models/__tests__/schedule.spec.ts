import { Schedule, WeekDaySchedule } from '../index';
import { DateHelper } from '../../infrastructure/dateHelper';
import { Weekday } from '../../enums/weekday';
import { TimeOfDay } from '../timeOfDay';
import { WeekDayBreak } from '../entities/weekDayBreak';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
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
	const wednesday = createDayOfWeekTemplate(Weekday.Wednesday, '09:30', '17:30', template);
	wednesday.breaks = [
		WeekDayBreak.create(Weekday.Wednesday, TimeOfDay.parse('16:00'), TimeOfDay.parse('17:00'), template)
	];

	template.weekdaySchedules = [
		createDayOfWeekTemplate(Weekday.Monday, '08:30', '16:00', template),
		createDayOfWeekTemplate(Weekday.Tuesday, '08:30', '15:00', template),
		wednesday
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

	it('should init weekday schedules', () => {
		const newSchedule = new Schedule();
		newSchedule.initWeekdaySchedules();

		expect(newSchedule.weekdaySchedules).toBeDefined();
	});

	it('should init set weekday schedules parent', () => {
		const newSchedule = new Schedule();
		const weekDay = new WeekDaySchedule();
		weekDay.weekDay = Weekday.Monday;
		newSchedule.weekdaySchedules = [
			weekDay
		];

		newSchedule.initWeekdaySchedules();
		newSchedule.verifyWeekdaySchedules();
		expect(weekDay.schedule).toBe(newSchedule);
	});

	it('should verify weekday schedules is initialized', () => {
		const newSchedule = new Schedule();

		expect(() => {
			newSchedule.verifyWeekdaySchedules();
		}).toThrowError();
	});

	it('should not create weekday schedule without schedule reference', () => {
		expect(() => {
			WeekDaySchedule.create(Weekday.Monday, null);
		}).toThrowError();
	});

	it('should generate timeslot with exact match', () => {
		const customSchedule = new Schedule();
		customSchedule.slotsDurationInMin = 60;
		const monday = createDayOfWeekTemplate(Weekday.Monday, '08:00', '12:00', customSchedule);
		monday.breaks = [
			WeekDayBreak.create(Weekday.Monday, TimeOfDay.parse('08:00'), TimeOfDay.parse('09:00'), customSchedule)
		];

		customSchedule.weekdaySchedules = [monday];

		const startTime = new Date(Date.parse('2020-6-8, 9:00:00 AM'));
		const endTime = new Date(Date.parse('2020-6-8, 10:00:00 AM'));

		const generated = Array.from(customSchedule.generateValidTimeslots({ startDatetime: startTime, endDatetime: endTime }));
		expect(generated.length).toBe(1);
	});
});
