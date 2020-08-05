import { TimeOfDay, WeekDayBreak } from '../index';
import { Weekday } from '../../enums/weekday';
import { ISchedule } from '../interfaces';

describe('week day break tests', () => {
	const dayBreak = WeekDayBreak.create(Weekday.Monday,
		TimeOfDay.create({ hours: 11, minutes: 30 }),
		TimeOfDay.create({ hours: 12, minutes: 45 }),
		{ slotsDurationInMin: 30 } as ISchedule);

	it('should not create without schedule', () => {
		expect(() => {
			WeekDayBreak.create(Weekday.Monday,
				TimeOfDay.create({ hours: 11, minutes: 30 }),
				TimeOfDay.create({ hours: 12, minutes: 45 }),
				null);
		}).toThrowError();
	});

	it('should not intersect break', () => {
		expect(dayBreak.intersects(
			TimeOfDay.create({ hours: 8, minutes: 0 }),
			TimeOfDay.create({ hours: 9, minutes: 0 }),
		)).toBe(false);

		expect(dayBreak.intersects(
			TimeOfDay.create({ hours: 10, minutes: 30 }),
			TimeOfDay.create({ hours: 11, minutes: 30 }),
		)).toBe(false);

		expect(dayBreak.intersects(
			TimeOfDay.create({ hours: 12, minutes: 45 }),
			TimeOfDay.create({ hours: 14, minutes: 0 }),
		)).toBe(false);

		expect(dayBreak.intersects(
			TimeOfDay.create({ hours: 14, minutes: 0 }),
			TimeOfDay.create({ hours: 15, minutes: 0 }),
		)).toBe(false);
	});

	it('should intersect break', () => {
		expect(dayBreak.intersects(
			TimeOfDay.create({ hours: 11, minutes: 0 }),
			TimeOfDay.create({ hours: 11, minutes: 31 }),
		)).toBe(true);

		expect(dayBreak.intersects(
			TimeOfDay.create({ hours: 12, minutes: 0 }),
			TimeOfDay.create({ hours: 12, minutes: 30 }),
		)).toBe(true);

		expect(dayBreak.intersects(
			TimeOfDay.create({ hours: 12, minutes: 44 }),
			TimeOfDay.create({ hours: 14, minutes: 0 }),
		)).toBe(true);
	});
});
