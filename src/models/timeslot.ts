import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Calendar } from './calendar';

@Entity()
export class Timeslot {

	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ type: "text" })
	public name: string;

	@Column({ type: "timestamp" })
	public firstSlotStartTime: Date;

	@Column({ type: "timestamp" })
	public lastSlotEndTime: Date;

	@Column({ type: "interger" })
	public slotsDuration: number;

	constructor(name: string, firstSlotStartTime: Date, lastSlotEndTime: Date, slotsDuration: number) {
		this.name = name;
		this.firstSlotStartTime = firstSlotStartTime;
		this.lastSlotEndTime = lastSlotEndTime;
		this.slotsDuration = slotsDuration;
	}
}
