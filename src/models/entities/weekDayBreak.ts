import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TimeOfDay, Transformer as TimeTransformer } from '../timeOfDay';
import { ISchedule, ITimeSpan } from '../interfaces';
import { Weekday } from '../../enums/weekday';
import * as timeSpan from '../../tools/timeSpan';

@Entity()
export class WeekDayBreak implements ITimeSpan {
	@PrimaryGeneratedColumn()
	public id: number;

	@ManyToOne('Schedule', { nullable: false })
	@JoinColumn({ name: 'scheduleId' })
	public schedule: ISchedule;
	@Column("int")
	public weekDay: Weekday;
	@Column({ type: "time", transformer: TimeTransformer })
	public startTime: TimeOfDay;
	@Column({ type: "time", transformer: TimeTransformer })
	public endTime: TimeOfDay;
	@Column({ nullable: false })
	private scheduleId: number;

	constructor() {
	}

	public static create(weekDay: Weekday, startTime: TimeOfDay, endTime: TimeOfDay, schedule: ISchedule): WeekDayBreak {
		if (!schedule) {
			throw new Error('Schedule reference cannot be null.');
		}

		const instance = new WeekDayBreak();
		instance.weekDay = weekDay;
		instance.startTime = startTime;
		instance.endTime = endTime;
		instance.schedule = schedule;

		return instance;
	}

	public getScheduleId() {
		return this.scheduleId;
	}

	public intersects(start: TimeOfDay, end: TimeOfDay): boolean {
		return timeSpan.intersects(this, start, end);
	}
}
