import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TimeOfDay, Transformer as TimeTransformer } from '../timeOfDay';
import { Weekday } from '../../enums/weekday';
import { ITimeslotsSchedule, ITimeSpan } from "../interfaces";
import * as timeSpan from '../../tools/timeSpan';

@Entity()
export class TimeslotItem implements ITimeSpan {
	constructor() {
	}

	@PrimaryGeneratedColumn()
	public _id: number;

	@Column({ nullable: false })
	public _timeslotsScheduleId: number;

	@ManyToOne('TimeslotsSchedule', { nullable: false })
	@JoinColumn({ name: '_timeslotsScheduleId' })
	public _timeslotsSchedule: ITimeslotsSchedule;

	@Column("int")
	public _weekDay: Weekday;

	@Column({ type: "time", transformer: TimeTransformer, nullable: false })
	public _startTime: TimeOfDay;

	@Column({ type: "time", transformer: TimeTransformer, nullable: false })
	public _endTime: TimeOfDay;

	public get startTime() { return this._startTime; }
	public get endTime() { return this._endTime; }

	public static create(timeslotScheduleId: number, weekDay: Weekday, startTime: TimeOfDay, endTime: TimeOfDay): TimeslotItem {
		const instance = new TimeslotItem();
		instance._timeslotsScheduleId = timeslotScheduleId;
		instance._startTime = startTime;
		instance._endTime = endTime;
		instance._weekDay = weekDay;
		return instance;
	}

	public intersects(other: TimeslotItem): boolean {
		if (this._weekDay !== other._weekDay) {
			return false;
		}

		return timeSpan.intersectsSpan(this, other);
	}
}
