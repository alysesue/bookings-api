import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Calendar } from './calendar';

@Entity()
export class Timeslot {

	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ type: "timestamp" })
	public startDatetime: Date;

	@Column({ type: "timestamp" })
	public endDatetime: Date;

	@ManyToOne(type => Calendar)
	public calendar: Calendar;

	@Column()
	public isAvailable: boolean;

	constructor(calendar: Calendar, startDatetime: Date, endDatetime: Date, isAvailable: boolean) {
		this.startDatetime = startDatetime;
		this.endDatetime = endDatetime;
		this.isAvailable = isAvailable;
		this.calendar = calendar;
	}
}
