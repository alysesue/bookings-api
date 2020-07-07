import { Column, Entity, JoinColumn, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TimeslotsSchedule } from './timeslotsSchedule';
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

	@Column({ type: "time", transformer: TimeTransformer, nullable: true })
	public openTime?: TimeOfDay;

	@Column({ type: "time", transformer: TimeTransformer, nullable: true })
	public closeTime?: TimeOfDay;

	public static create(timeslotScheduleId: number, weekDay: Weekday, openTime?: TimeOfDay, closeTime?: TimeOfDay): TimeslotItem {
		const instance = new TimeslotItem();
		instance.timeslotScheduleId = timeslotScheduleId;
		instance.openTime = openTime;
		instance.closeTime = closeTime;
		instance.weekDay = weekDay;
		return instance;
	}


}
