import {
	Column,
	Entity,
	JoinColumn,
	JoinTable,
	ManyToMany,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { IEvent, IService } from '../interfaces';
import { Label } from './label';
import { OneOffTimeslot } from './oneOffTimeslot';
import { sortDate } from '../../tools/date';

@Entity()
export class Event implements IEvent {
	constructor() {}

	@PrimaryGeneratedColumn()
	private _id: number;

	@ManyToOne('Service')
	@JoinColumn({ name: '_serviceId' })
	private _service: IService;

	@Column()
	private _serviceId: number;

	@Column({ type: 'varchar', length: 5000, nullable: true })
	private _title: string;

	@Column({ type: 'varchar', length: 5000, nullable: true })
	private _description: string;

	@Column({ default: 1 })
	private _capacity: number;

	@Column({ default: true })
	private _isOneOffTimeslot: boolean;

	@ManyToMany(() => Label, { cascade: true })
	@JoinTable({
		name: 'event_label',
		joinColumn: { name: 'event_id' },
		inverseJoinColumn: { name: 'label_id' },
	})
	private _labels: Label[];

	@Column({ default: new Date('2020-01-01T14:00:00.000Z') })
	private _firstStartDateTime: Date;

	@Column({ default: new Date('2050-01-01T14:00:00.000Z') })
	private _lastEndDateTime: Date;

	@OneToMany(() => OneOffTimeslot, (oneOffTimeslot) => oneOffTimeslot._event, { cascade: true })
	private _oneOffTimeslots: OneOffTimeslot[];

	public get id(): number {
		return this._id;
	}

	public set id(value: number) {
		this._id = value;
	}

	public get capacity(): number {
		return this._capacity;
	}

	public set capacity(value: number) {
		this._capacity = value;
	}

	public get title(): string {
		return this._title;
	}

	public set title(value: string) {
		this._title = value;
	}

	public get description(): string {
		return this._description;
	}

	public set description(value: string) {
		this._description = value;
	}

	public set labels(value: Label[]) {
		this._labels = value;
	}

	public get labels(): Label[] {
		return this._labels;
	}

	public get service(): IService {
		return this._service;
	}

	public set service(value: IService) {
		this._service = value;
	}

	public get serviceId(): number {
		return this._serviceId;
	}

	public set serviceId(value: number) {
		this._serviceId = value;
	}

	public get oneOffTimeslots(): OneOffTimeslot[] {
		return this._oneOffTimeslots;
	}

	public set oneOffTimeslots(value: OneOffTimeslot[]) {
		this._oneOffTimeslots = value;
	}

	public get isOneOffTimeslot(): boolean {
		return this._isOneOffTimeslot;
	}

	public set isOneOffTimeslot(value: boolean) {
		this._isOneOffTimeslot = value;
	}

	public get firstStartDateTime(): Date {
		return this._firstStartDateTime;
	}

	public set firstStartDateTime(value: Date) {
		this._firstStartDateTime = value;
	}

	public get lastEndDateTime(): Date {
		return this._lastEndDateTime;
	}

	public set lastEndDateTime(value: Date) {
		this._lastEndDateTime = value;
	}

	public setDateRange({ firstStartDateTime, lastEndDateTime }: DateRange): void {
		this.firstStartDateTime = firstStartDateTime;
		this.lastEndDateTime = lastEndDateTime;
	}

	public getDateRange(): DateRange {
		const sortStartDates = sortDate(this.oneOffTimeslots.map((slot) => slot.startDateTime));
		const sortEndDate = sortDate(this.oneOffTimeslots.map((slot) => slot.endDateTime));
		const firstStartDateTime = sortStartDates[0];
		const lastEndDateTime = sortEndDate[sortEndDate.length - 1];
		return { firstStartDateTime, lastEndDateTime };
	}
}

type DateRange = {
	firstStartDateTime: Date;
	lastEndDateTime: Date;
};
