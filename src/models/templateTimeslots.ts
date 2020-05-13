import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Weekday } from "../enums/weekday";
import { TemplateTimeslotRequest } from "../components/templatesTimeslots/templatesTimeslots.apicontract";

@Entity()
export class TemplateTimeslots extends BaseEntity {

	@PrimaryGeneratedColumn()
	public id: number;

	@Column({type: "text"})
	public name: string;

	@Column({type: "time"})
	public firstSlotStartTimeInHHmm: string;

	@Column({type: "time"})
	public firstSlotEndTimeInHHmm: string;

	@Column({type: "int"})
	public slotsDurationInMin: number;

	@Column("int", {array: true})
	public weekdays: Weekday[];

	constructor() {
		super();
	}

	public mapTemplateTimeslotRequest(template: TemplateTimeslotRequest) {
		this.name = template.name;
		this.firstSlotStartTimeInHHmm = template.firstSlotStartTimeInHHmm;
		this.firstSlotEndTimeInHHmm = template.firstSlotEndTimeInHHmm;
		this.slotsDurationInMin = template.slotsDurationInMin;
		this.weekdays = template.weekdays;
	}
}
