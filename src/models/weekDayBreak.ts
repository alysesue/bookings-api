import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TimeOfDay, Transformer as TimeTransformer } from './timeOfDay';
import { ISchedule } from './interfaces';
import { Weekday } from '../enums/weekday';

@Entity()
@Index(["scheduleId", "weekDay"], { unique: true })
export class WeekDayBreak {
	@PrimaryGeneratedColumn()
	public id: number;

	@ManyToOne('Schedule', { nullable: false })
	@JoinColumn({ name: 'scheduleId' })
	public schedule: ISchedule;

	@Column({ nullable: false })
	private scheduleId: number;

	public getScheduleId() {
		return this.scheduleId;
	}

	@Column("int")
	public weekDay: Weekday;

	@Column({ type: "time", transformer: TimeTransformer })
	public startTime: TimeOfDay;

	@Column({ type: "time", transformer: TimeTransformer })
	public endTime: TimeOfDay;

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

	public intersects(start: TimeOfDay, end: TimeOfDay): boolean {
		const compareThisEndOtherStart = TimeOfDay.compare(this.endTime, start);
		if (compareThisEndOtherStart > 0) {
			const compareOtherEndThisStart = TimeOfDay.compare(end, this.startTime);
			return compareOtherEndThisStart > 0;
		}

		return false;
	}
}
