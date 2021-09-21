import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IEvent, IServiceProvider } from '../interfaces';
import { Timeslot } from '../timeslot';
import { ServiceProvider } from './serviceProvider';

@Entity()
export class OneOffTimeslot implements Timeslot {
	constructor() {}

	@PrimaryGeneratedColumn()
	private _id: number;

	@Column()
	@Index()
	private _startDateTime: Date;

	@Column()
	@Index()
	private _endDateTime: Date;

	@ManyToOne('ServiceProvider')
	@JoinColumn({ name: '_serviceProviderId' })
	private _serviceProvider: IServiceProvider;

	@Column()
	@Index()
	private _serviceProviderId: number;

	@ManyToOne('Event', { orphanedRowAction: 'delete' })
	@JoinColumn({ name: '_eventId' })
	public _event: IEvent;

	@Column({ nullable: true })
	private _eventId: number;

	public static create(arg: CreateOneOffTimeslot): OneOffTimeslot {
		const { startDateTime, endDateTime, id, serviceProvider } = arg;
		const slot = new OneOffTimeslot();
		slot.serviceProvider = serviceProvider;
		slot.serviceProviderId = serviceProvider.id;
		slot.startDateTime = startDateTime;
		slot.endDateTime = endDateTime;
		slot.id = id;
		return slot;
	}

	public get id(): number {
		return this._id;
	}

	public set id(value: number) {
		this._id = value;
	}

	public get startDateTime(): Date {
		return this._startDateTime;
	}

	public set startDateTime(value: Date) {
		this._startDateTime = value;
	}

	public get endDateTime(): Date {
		return this._endDateTime;
	}

	public set endDateTime(value: Date) {
		this._endDateTime = value;
	}

	public get serviceProvider(): IServiceProvider {
		return this._serviceProvider;
	}

	public set serviceProvider(serviceProvider: IServiceProvider) {
		this._serviceProvider = serviceProvider;
	}

	public set serviceProviderId(value: number) {
		this._serviceProviderId = value;
	}

	public get serviceProviderId(): number {
		return this._serviceProviderId;
	}

	public get startTimeNative(): number {
		return this._startDateTime.getTime();
	}

	public get endTimeNative(): number {
		return this._endDateTime.getTime();
	}

	public get oneOffTimeslotId(): number {
		return this._id;
	}

	public get eventId(): number {
		return this._eventId;
	}

	public set eventId(value: number) {
		this._eventId = value;
	}
}

type CreateOneOffTimeslot = {
	serviceProvider: ServiceProvider;
	startDateTime: Date;
	endDateTime: Date;
	id?: number;
};
