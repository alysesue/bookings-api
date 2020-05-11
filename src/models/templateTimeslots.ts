import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class TemplateTimeslots {

	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ type: "text" })
	public name: string;

	@Column({ type: "timestamp" })
	public firstSlotStartTime: Date;

	@Column({ type: "timestamp" })
	public lastSlotEndTime: Date;

	@Column({ type: "int" })
	public slotsDuration: number;

	constructor(name: string, firstSlotStartTime: Date, lastSlotEndTime: Date, slotsDuration: number) {
		this.name = name;
		this.firstSlotStartTime = firstSlotStartTime;
		this.lastSlotEndTime = lastSlotEndTime;
		this.slotsDuration = slotsDuration;
	}
}
