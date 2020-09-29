import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TimeOfDay, Transformer as TimeTransformer } from '../timeOfDay';
import { IScheduleForm, ITimeSpan } from '../interfaces';
import { Weekday } from '../../enums/weekday';
import * as timeSpan from '../../tools/timeSpan';

@Entity()
export class WeekDayBreak implements ITimeSpan {
	@PrimaryGeneratedColumn()
	public id: number;

	@ManyToOne('ScheduleForm', { nullable: false })
	@JoinColumn({ name: 'scheduleFormId' })
	public scheduleForm: IScheduleForm;
	@Column('int')
	public weekDay: Weekday;
	@Column({ type: 'time', transformer: TimeTransformer })
	public startTime: TimeOfDay;
	@Column({ type: 'time', transformer: TimeTransformer })
	public endTime: TimeOfDay;
	@Column({ nullable: false })
	private scheduleFormId: number;

	constructor() {}

	public static create(
		weekDay: Weekday,
		startTime: TimeOfDay,
		endTime: TimeOfDay,
		scheduleForm: IScheduleForm,
	): WeekDayBreak {
		if (!scheduleForm) {
			throw new Error('ScheduleForm reference cannot be null.');
		}

		const instance = new WeekDayBreak();
		instance.weekDay = weekDay;
		instance.startTime = startTime;
		instance.endTime = endTime;
		instance.scheduleForm = scheduleForm;

		return instance;
	}

	public getScheduleId() {
		return this.scheduleFormId;
	}

	public intersects(start: TimeOfDay, end: TimeOfDay): boolean {
		return timeSpan.intersects(this, start, end);
	}
}
