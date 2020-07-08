import { Column, Entity, JoinColumn, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TimeOfDay, Transformer as TimeTransformer } from '../timeOfDay';
import { Weekday } from '../../enums/weekday';
import { ITimeslotsSchedule } from "../interfaces";

@Entity()
@Index(["timeslotScheduleId", "weekDay"], { unique: true })
export class TimeslotItem {
	constructor() {
	}

	@PrimaryGeneratedColumn()
	public _id: number;

	@Column({ nullable: false })
	private timeslotScheduleId: number;

	@ManyToOne('TimeslotsSchedule', { nullable: false })
	@JoinColumn({ name: 'timeslotsScheduleId' })
	public _timeslotsSchedule: ITimeslotsSchedule;

	@Column("int")
	public weekDay: Weekday;

	@Column({ type: "time", transformer: TimeTransformer, nullable: false })
	public startTime: TimeOfDay;

	@Column({ type: "time", transformer: TimeTransformer, nullable: false })
	public endTime: TimeOfDay;

	public static create(timeslotScheduleId: number, weekDay: Weekday, startTime: TimeOfDay, endTime: TimeOfDay): TimeslotItem {
		const instance = new TimeslotItem();
		instance.timeslotScheduleId = timeslotScheduleId;
		instance.startTime = startTime;
		instance.endTime = endTime;
		instance.weekDay = weekDay;
		return instance;
	}
}
