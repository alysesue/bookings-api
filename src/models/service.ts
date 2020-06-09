import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ISchedule } from '../models/interfaces';

@Entity()
export class Service extends BaseEntity {

	@PrimaryGeneratedColumn()
	private _id: number;

	public get id(): number {
		return this._id;
	}

	@Column()
	@Index({ unique: true })
	private _name: string;

	public set name(name: string) {
		this._name = name;
	}

	public get name() {
		return this._name;
	}

	@ManyToOne('Schedule', { nullable: true })
	@JoinColumn({ name: '_scheduleId' })
	public _schedule: ISchedule;

	public set schedule(schedule: ISchedule) {
		this._schedule = schedule;
	}

	public get schedule(): ISchedule {
		return this._schedule;
	}

	@Column({ nullable: true })
	private _scheduleId?: number;

	public get scheduleId(): number { return this._scheduleId; }
}
