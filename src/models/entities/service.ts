import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IEntityWithScheduleForm, IEntityWithTimeslotsSchedule, IService } from '../interfaces';
import { TimeslotsSchedule } from './timeslotsSchedule';
import { ServiceAdminGroupMap } from './serviceAdminGroupMap';
import { Organisation } from './organisation';
import { ScheduleForm } from './scheduleForm';

@Entity()
@Index(['_organisationId', '_name'], { unique: true })
export class Service implements IService, IEntityWithScheduleForm, IEntityWithTimeslotsSchedule {
	@PrimaryGeneratedColumn()
	private _id: number;

	public set id(id: number) {
		this._id = id;
	}

	public get id(): number {
		return this._id;
	}

	@Column({ nullable: false })
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
	private _name: string;

	public set name(name: string) {
		this._name = name;
	}

	public get name() {
		return this._name;
	}

	@OneToOne('ScheduleForm', { nullable: true, cascade: true })
	@JoinColumn({ name: '_scheduleFormId' })
	public _scheduleForm: ScheduleForm;

	public set scheduleForm(schedule: ScheduleForm) {
		this._scheduleForm = schedule;
	}

	public get scheduleForm(): ScheduleForm {
		return this._scheduleForm;
	}

	@Column({ nullable: true })
	private _scheduleFormId?: number;

	public set scheduleFormId(id: number) {
		this._scheduleFormId = id;
	}
	public get scheduleFormId(): number {
		return this._scheduleFormId;
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
	public _timeslotsSchedule: TimeslotsSchedule;

	public set timeslotsSchedule(value: TimeslotsSchedule) {
		this._timeslotsSchedule = value;
	}
	public get timeslotsSchedule(): TimeslotsSchedule {
		return this._timeslotsSchedule;
	}
}
