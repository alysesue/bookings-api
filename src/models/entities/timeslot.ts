import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TimeslotsSchedule } from './timeslotsSchedule';
import { TimeOfDay, Transformer as TimeTransformer } from '../timeOfDay';
import { Weekday } from '../../enums/weekday';

@Entity()
export class Timeslot {
	constructor() {
	}

	@PrimaryGeneratedColumn()
	public _id: number;

	@Column({ nullable: false })
	private timeslotScheduleId: number;

	@ManyToOne('Timeslot', { nullable: false })
	@JoinColumn({ name: 'timeslotsScheduleId' })
	public _timeslotsSchedule: TimeslotsSchedule;

	@Column("int")
	public weekDay: Weekday;

	@Column({ type: "time", transformer: TimeTransformer, nullable: true })
	public openTime?: TimeOfDay;

	@Column({ type: "time", transformer: TimeTransformer, nullable: true })
	public closeTime?: TimeOfDay;

	public static create(timeslotScheduleId: number, weekDay: Weekday, openTime?: TimeOfDay, closeTime?: TimeOfDay): Timeslot {
		const instance = new Timeslot();
		instance.timeslotScheduleId = timeslotScheduleId;
		instance.openTime = openTime;
		instance.closeTime = closeTime;
		instance.weekDay = weekDay;
		return instance;
	}


}
