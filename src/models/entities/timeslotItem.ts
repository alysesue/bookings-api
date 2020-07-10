import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TimeOfDay, Transformer as TimeTransformer } from '../timeOfDay';
import { Weekday } from '../../enums/weekday';
import { ITimeslotsSchedule } from "../interfaces";

@Entity()
export class TimeslotItem {
	constructor() {
	}

	@PrimaryGeneratedColumn()
	public _id: number;

	@Column({ nullable: false })
	private _timeslotsScheduleId: number;

	@ManyToOne('TimeslotsSchedule', { nullable: false })
	@JoinColumn({ name: '_timeslotsScheduleId' })
	public _timeslotsSchedule: ITimeslotsSchedule;

	@Column("int")
	public _weekDay: Weekday;

	@Column({ type: "time", transformer: TimeTransformer, nullable: false })
	public _startTime: TimeOfDay;

	@Column({ type: "time", transformer: TimeTransformer, nullable: false })
	public _endTime: TimeOfDay;

	public static create(timeslotScheduleId: number, weekDay: Weekday, startTime: TimeOfDay, endTime: TimeOfDay): TimeslotItem {
		const instance = new TimeslotItem();
		instance._timeslotsScheduleId = timeslotScheduleId;
		instance._startTime = startTime;
		instance._endTime = endTime;
		instance._weekDay = weekDay;
		return instance;
	}
}
