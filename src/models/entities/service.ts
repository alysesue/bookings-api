import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Schedule } from './schedule';
import { IEntityWithSchedule, IEntityWithTimeslotsSchedule, IService } from '../interfaces';
import { TimeslotsSchedule } from './timeslotsSchedule';
import { ServiceAdminGroupMap } from './serviceAdminGroupMap';
import { Organisation } from './organisation';

@Entity()
export class Service implements IService, IEntityWithSchedule, IEntityWithTimeslotsSchedule {
	@PrimaryGeneratedColumn()
	private _id: number;

	public set id(id: number) {
		this._id = id;
	}

	public get id(): number {
		return this._id;
	}

	// TODO: make nullable false here. Requires some DB cleanup...
	@Column({ nullable: true })
	@Index()
	private _organisationId: number;

	public set organisationId(value: number) {
		this._organisationId = value;
	}

	public get organisationId() {
		return this._organisationId;
	}

	@ManyToOne((type) => Organisation)
	@JoinColumn({ name: '_organisationId' })
	private _organisation: Organisation;

	public set organisation(value: Organisation) {
		this._organisation = value;
	}

	public get organisation() {
		return this._organisation;
	}

	@OneToOne((type) => ServiceAdminGroupMap, (e) => e._service, { nullable: true })
	public _serviceAdminGroupMap: ServiceAdminGroupMap;

	@Column({ type: 'varchar', length: 100, nullable: false })
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

	public set scheduleId(id: number) {
		this._scheduleId = id;
	}
	public get scheduleId(): number {
		return this._scheduleId;
	}

	@Column({ nullable: true })
	private _timeslotsScheduleId: number;

	public set timeslotsScheduleId(id: number) {
		this._timeslotsScheduleId = id;
	}
	public get timeslotsScheduleId(): number {
		return this._timeslotsScheduleId;
	}

	@OneToOne((type) => TimeslotsSchedule, (e) => e._service, { cascade: true })
	@JoinColumn({ name: '_timeslotsScheduleId' })
	private _timeslotsSchedule: TimeslotsSchedule;

	public set timeslotsSchedule(value: TimeslotsSchedule) {
		this._timeslotsSchedule = value;
	}
	public get timeslotsSchedule(): TimeslotsSchedule {
		return this._timeslotsSchedule;
	}
}
