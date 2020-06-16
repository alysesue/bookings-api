import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Schedule } from './schedule';

@Entity()
export class Service extends BaseEntity {

	@PrimaryGeneratedColumn()
	private _id: number;

	public set id(id: number) {
		this._id = id;
	}

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
	public _schedule: Schedule;

	public set schedule(schedule: Schedule) {
		this._schedule = schedule;
	}

	public get schedule(): Schedule {
		return this._schedule;
	}

	@Column({ nullable: true })
	private _scheduleId?: number;

	public set scheduleId(id: number) { this._scheduleId = id; }
	public get scheduleId(): number { return this._scheduleId; }
}
