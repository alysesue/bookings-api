import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Weekday } from "../enums/weekday";
import { TemplateTimeslotRequest } from "../components/templatesTimeslots/templatesTimeslots.apicontract";

@Entity()
export class TemplateTimeslots extends BaseEntity {

	@PrimaryGeneratedColumn()
	public id: number;

	@Column({type: "varchar", length: 100})
	public name: string;

	@Column({type: "time"})
	public firstSlotStartTimeInHHmm: string;

	@Column({type: "time"})
	public lastSlotEndTimeInHHmm: string;

	@Column({type: "int"})
	public slotsDurationInMin: number;

	@Column("int", {array: true})
	public weekdays: Weekday[];

	constructor() {
		super();
	}

	public static mapTemplateTimeslotRequest(template: TemplateTimeslotRequest) {
		return {
			name : template.name,
			firstSlotStartTimeInHHmm : template.firstSlotStartTimeInHHmm,
			lastSlotEndTimeInHHmm : template.lastSlotEndTimeInHHmm,
			slotsDurationInMin: template.slotsDurationInMin,
			weekdays: template.weekdays,
		} as TemplateTimeslots;
	}
}
