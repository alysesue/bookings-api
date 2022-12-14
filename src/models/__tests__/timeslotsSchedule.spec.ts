import { TimeslotItem, TimeslotsSchedule } from '../index';
import { DateHelper } from '../../infrastructure/dateHelper';
import { Weekday } from '../../enums/weekday';
import { TimeOfDay } from '../timeOfDay';

afterAll(() => {
	jest.resetAllMocks();
	if (global.gc) global.gc();
});

describe('[Timeslots schedule] template', () => {
	const template = new TimeslotsSchedule();
	template._id = 1;
	template.timeslotItems = [
		TimeslotItem.create(1, Weekday.Monday, TimeOfDay.parse('08:30'), TimeOfDay.parse('09:30')),
		TimeslotItem.create(1, Weekday.Monday, TimeOfDay.parse('09:30'), TimeOfDay.parse('10:30')),
		TimeslotItem.create(1, Weekday.Monday, TimeOfDay.parse('10:30'), TimeOfDay.parse('11:30')),
		TimeslotItem.create(1, Weekday.Monday, TimeOfDay.parse('11:30'), TimeOfDay.parse('12:30')),
		TimeslotItem.create(1, Weekday.Monday, TimeOfDay.parse('12:30'), TimeOfDay.parse('13:30')),
		TimeslotItem.create(1, Weekday.Monday, TimeOfDay.parse('13:30'), TimeOfDay.parse('14:30')),
		TimeslotItem.create(1, Weekday.Monday, TimeOfDay.parse('14:30'), TimeOfDay.parse('15:30')),

		TimeslotItem.create(1, Weekday.Tuesday, TimeOfDay.parse('08:30'), TimeOfDay.parse('09:30')),
		TimeslotItem.create(1, Weekday.Tuesday, TimeOfDay.parse('09:30'), TimeOfDay.parse('10:30')),
		TimeslotItem.create(1, Weekday.Tuesday, TimeOfDay.parse('10:30'), TimeOfDay.parse('11:30')),
		TimeslotItem.create(1, Weekday.Tuesday, TimeOfDay.parse('11:30'), TimeOfDay.parse('12:30')),
		TimeslotItem.create(1, Weekday.Tuesday, TimeOfDay.parse('12:30'), TimeOfDay.parse('13:30')),
		TimeslotItem.create(1, Weekday.Tuesday, TimeOfDay.parse('13:30'), TimeOfDay.parse('14:30')),

		TimeslotItem.create(1, Weekday.Wednesday, TimeOfDay.parse('09:30'), TimeOfDay.parse('10:30')),
		TimeslotItem.create(1, Weekday.Wednesday, TimeOfDay.parse('10:30'), TimeOfDay.parse('11:30')),
		TimeslotItem.create(1, Weekday.Wednesday, TimeOfDay.parse('11:30'), TimeOfDay.parse('12:30')),
		TimeslotItem.create(1, Weekday.Wednesday, TimeOfDay.parse('12:30'), TimeOfDay.parse('13:30')),
		TimeslotItem.create(1, Weekday.Wednesday, TimeOfDay.parse('13:30'), TimeOfDay.parse('14:30')),
		TimeslotItem.create(1, Weekday.Wednesday, TimeOfDay.parse('14:30'), TimeOfDay.parse('15:30')),
	];

	const date = new Date(2020, 4, 12); // May 12th -  Tuesday;

	it('[Timeslots schedule] should generate single timeslot', () => {
		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 8, 30),
			endDatetime: DateHelper.setHours(date, 9, 30),
		});

		const list = Array.from(generate);

		expect(list.length).toBe(1);
	});

	it('[Timeslots schedule] should generate monthly timeslots', () => {
		const generate = template.generateValidTimeslots({
			startDatetime: new Date('2020-10-31T16:00:00.000Z'),
			endDatetime: new Date('2020-11-30T15:59:59.999Z'),
		});

		const list = Array.from(generate);

		expect(list.length).toBe(83);
	});

	it('[Timeslots schedule] should generate multiple timeslots', () => {
		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 12, 0),
			endDatetime: DateHelper.setHours(date, 18, 0),
		});

		const list = Array.from(generate);

		expect(list.length).toBe(2);
	});

	it('[Timeslots schedule] should generate first timeslot only when the template starts', () => {
		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 6, 0),
			endDatetime: DateHelper.setHours(date, 10, 0),
		});

		const list = Array.from(generate);

		expect(list.length).toBe(1);
		expect(DateHelper.getTimeString(new Date(list[0].startTimeNative))).toBe('08:30');
		expect(DateHelper.getTimeString(new Date(list[0].endTimeNative))).toBe('09:30');
	});

	it('[Timeslots schedule] should discard last timeslot when it doesnt fit the window', () => {
		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 13, 0),
			endDatetime: DateHelper.setHours(date, 18, 0),
		});

		const list = Array.from(generate);

		expect(list.length).toBe(1);
		expect(DateHelper.getTimeString(new Date(list[0].startTimeNative))).toBe('13:30');
		expect(DateHelper.getTimeString(new Date(list[0].endTimeNative))).toBe('14:30');
	});

	it('[Timeslots schedule] should generate timeslots over the next day', () => {
		const nextDay = DateHelper.addDays(date, 1);

		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 13, 0),
			endDatetime: DateHelper.setHours(nextDay, 11, 0),
		});

		const list = Array.from(generate);
		expect(list.length).toBe(2);

		expect(new Date(list[0].startTimeNative).getDate()).toBe(date.getDate());
		expect(DateHelper.getTimeString(new Date(list[0].startTimeNative))).toBe('13:30');

		expect(new Date(list[1].startTimeNative).getDate()).toBe(nextDay.getDate());
		expect(DateHelper.getTimeString(new Date(list[1].startTimeNative))).toBe('09:30');
	});

	it('[Timeslots schedule] should generate timeslots over multiple days', () => {
		const anotherDate = DateHelper.addDays(date, 2);

		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 12, 0),
			endDatetime: DateHelper.setHours(anotherDate, 12, 0),
		});

		const list = Array.from(generate);
		expect(list.length).toBe(8); // Thursday is not a work day

		expect(new Date(list[0].startTimeNative).getDate()).toBe(date.getDate());
		expect(DateHelper.getTimeString(new Date(list[0].startTimeNative))).toBe('12:30');

		for (const element of list) {
			const hours = new Date(element.startTimeNative).getHours();
			expect(hours).toBeGreaterThanOrEqual(8);
			expect(hours).toBeLessThanOrEqual(14);
		}
	});

	it('[Timeslots schedule] should generate no timeslots', () => {
		const generate = template.generateValidTimeslots({
			startDatetime: DateHelper.setHours(date, 8, 31),
			endDatetime: DateHelper.setHours(date, 9, 30),
		});

		const list = Array.from(generate);

		expect(list.length).toBe(0);
	});

	it('[Timeslots schedule] should generate timeslot with exact match', () => {
		const customSchedule = new TimeslotsSchedule();
		customSchedule._id = 2;
		customSchedule.timeslotItems = [
			TimeslotItem.create(2, Weekday.Monday, TimeOfDay.parse('09:00'), TimeOfDay.parse('10:00')),
			TimeslotItem.create(2, Weekday.Monday, TimeOfDay.parse('10:00'), TimeOfDay.parse('11:00')),
			TimeslotItem.create(2, Weekday.Monday, TimeOfDay.parse('11:00'), TimeOfDay.parse('12:00')),
		];

		const startTime = new Date(Date.parse('2020-6-8, 9:00:00 AM'));
		const endTime = new Date(Date.parse('2020-6-8, 10:00:00 AM'));

		const generated = Array.from(
			customSchedule.generateValidTimeslots({ startDatetime: startTime, endDatetime: endTime }),
		);
		expect(generated.length).toBe(1);
	});
});
