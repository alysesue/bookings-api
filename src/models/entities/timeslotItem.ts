import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TimeOfDay, Transformer as TimeTransformer } from '../timeOfDay';
import { Weekday } from '../../enums/weekday';
import { ITimeslotsSchedule, ITimeSpan } from '../interfaces';
import * as timeSpan from '../../tools/timeSpan';
import { intersects } from '../../tools/timeSpan';
import { ScheduleForm } from './scheduleForm';

@Entity()
export class TimeslotItem implements ITimeSpan {
	constructor() {}

	@PrimaryGeneratedColumn()
	public _id: number;

	@Column({ nullable: false })
	public _timeslotsScheduleId: number;

	@ManyToOne('TimeslotsSchedule', { nullable: false })
	@JoinColumn({ name: '_timeslotsScheduleId' })
	public _timeslotsSchedule: ITimeslotsSchedule;

	@Column('int')
	public _weekDay: Weekday;

	@Column({ type: 'time', transformer: TimeTransformer, nullable: false })
	public _startTime: TimeOfDay;

	@Column({ type: 'time', transformer: TimeTransformer, nullable: false })
	public _endTime: TimeOfDay;

	public get startTime() {
		return this._startTime;
	}
	public get endTime() {
		return this._endTime;
	}

	@Column({ nullable: false, default: 1 })
	public _capacity: number;

	public static create(
		timeslotScheduleId: number,
		weekDay: Weekday,
		startTime: TimeOfDay,
		endTime: TimeOfDay,
		capacity = 1,
	): TimeslotItem {
		const instance = new TimeslotItem();
		instance._timeslotsScheduleId = timeslotScheduleId;
		instance._startTime = startTime;
		instance._endTime = endTime;
		instance._weekDay = weekDay;
		instance._capacity = capacity;
		return instance;
	}

	public intersects(other: TimeslotItem): boolean {
		if (this._weekDay !== other._weekDay) {
			return false;
		}

		return timeSpan.intersectsSpan(this, other);
	}

	public static generateTimeslotsItems(scheduleForm: ScheduleForm, timeslotsScheduleId: number): TimeslotItem[] {
		const timeslotItems = [];
		const activeWeekdaySchedules = scheduleForm.weekdaySchedules.filter((weekday) => weekday.hasScheduleForm);
		activeWeekdaySchedules.forEach((weekDay) => {
			let startTimeslotItem = weekDay.openTime;
			let endTimeslotItem = startTimeslotItem.addMinutes(scheduleForm.slotsDurationInMin);
			while (TimeOfDay.compare(weekDay.closeTime, endTimeslotItem) >= 0) {
				const findOverlapsBreak = weekDay.breaks.find((breakRange) =>
					intersects(
						{
							startTime: startTimeslotItem,
							endTime: endTimeslotItem,
						},
						breakRange.startTime,
						breakRange.endTime,
					),
				);
				if (findOverlapsBreak) {
					startTimeslotItem = findOverlapsBreak.endTime;
				} else {
					const timeslotItem = TimeslotItem.create(
						timeslotsScheduleId,
						weekDay.weekDay,
						startTimeslotItem,
						endTimeslotItem,
						weekDay.capacity
					);
					timeslotItems.push(timeslotItem);
					startTimeslotItem = endTimeslotItem;
				}
				endTimeslotItem = startTimeslotItem.addMinutes(scheduleForm.slotsDurationInMin);
			}
		});
		return timeslotItems;
	}
}
