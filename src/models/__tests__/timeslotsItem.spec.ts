import { TimeOfDay, TimeslotItem } from '../index';
import { Weekday } from '../../enums/weekday';
import { ScheduleForm, WeekDayBreak, WeekDaySchedule } from '../entities';

describe('Should test timeslots items', () => {
	const scheduleFormRequestComplex = new ScheduleForm();
	scheduleFormRequestComplex.slotsDurationInMin = 10;
	const weekdaySchedule = WeekDaySchedule.create(Weekday.Monday, scheduleFormRequestComplex);
	weekdaySchedule.hasScheduleForm = true;
	weekdaySchedule.openTime = TimeOfDay.create({ hours: 8, minutes: 5 });
	weekdaySchedule.closeTime = TimeOfDay.create({ hours: 8, minutes: 30 });
	const break1 = new WeekDayBreak();

	it('should not generate timeslots', () => {
		break1.startTime = TimeOfDay.create({ hours: 8, minutes: 10 });
		break1.endTime = TimeOfDay.create({ hours: 8, minutes: 30 });
		weekdaySchedule.breaks = [break1];
		scheduleFormRequestComplex.weekdaySchedules = [weekdaySchedule];
		const timeslotItems = TimeslotItem.generateTimeslotsItems(scheduleFormRequestComplex, 1);
		expect(timeslotItems.length).toBe(0);
	});

	it('should generate 1 timeslot because of break', async () => {
		break1.startTime = TimeOfDay.create({ hours: 8, minutes: 15 });
		break1.endTime = TimeOfDay.create({ hours: 8, minutes: 30 });
		weekdaySchedule.breaks = [break1];
		scheduleFormRequestComplex.weekdaySchedules = [weekdaySchedule];
		const timeslotItems = TimeslotItem.generateTimeslotsItems(scheduleFormRequestComplex, 1);
		expect(timeslotItems.length).toBe(1);
		expect(timeslotItems[0]._weekDay).toBe(Weekday.Monday);
		expect(timeslotItems[0]._startTime.toString()).toBe('08:05');
		expect(timeslotItems[0]._endTime.toString()).toBe('08:15');
	});

	it('should generate timeslots with complex schedueForm', async () => {
		weekdaySchedule.openTime = TimeOfDay.create({ hours: 8, minutes: 6 });
		weekdaySchedule.closeTime = TimeOfDay.create({ hours: 8, minutes: 40 });
		break1.startTime = TimeOfDay.create({ hours: 8, minutes: 15 });
		break1.endTime = TimeOfDay.create({ hours: 8, minutes: 20 });
		const break2 = new WeekDayBreak();
		break2.startTime = TimeOfDay.create({ hours: 8, minutes: 25 });
		break2.endTime = TimeOfDay.create({ hours: 8, minutes: 30 });
		const break3 = new WeekDayBreak();
		break3.startTime = TimeOfDay.create({ hours: 8, minutes: 30 });
		break3.endTime = TimeOfDay.create({ hours: 8, minutes: 35 });
		weekdaySchedule.breaks = [break1, break2, break3];
		scheduleFormRequestComplex.weekdaySchedules = [weekdaySchedule];
		const timeslotItems = TimeslotItem.generateTimeslotsItems(scheduleFormRequestComplex, 1);
		expect(timeslotItems.length).toBe(0);
	});

	it('should generate timeslots with complex schedueForm', async () => {
		weekdaySchedule.openTime = TimeOfDay.create({ hours: 8, minutes: 6 });
		weekdaySchedule.closeTime = TimeOfDay.create({ hours: 8, minutes: 40 });
		break1.startTime = TimeOfDay.create({ hours: 8, minutes: 15 });
		break1.endTime = TimeOfDay.create({ hours: 8, minutes: 20 });

		const break3 = new WeekDayBreak();
		break3.startTime = TimeOfDay.create({ hours: 8, minutes: 30 });
		break3.endTime = TimeOfDay.create({ hours: 8, minutes: 35 });
		weekdaySchedule.breaks = [break1, break3];
		scheduleFormRequestComplex.weekdaySchedules = [weekdaySchedule];
		const timeslotItems = TimeslotItem.generateTimeslotsItems(scheduleFormRequestComplex, 1);
		expect(timeslotItems.length).toBe(1);
		expect(timeslotItems[0]._weekDay).toBe(Weekday.Monday);
		expect(timeslotItems[0]._startTime.toString()).toBe('08:20');
		expect(timeslotItems[0]._endTime.toString()).toBe('08:30');
	});
});
