import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IServiceProvider } from '../interfaces';
import { TimeslotWithCapacity } from '../timeslotWithCapacity';

@Entity()
export class OneOffTimeslot implements TimeslotWithCapacity {
	constructor() {}

	public get startTimeNative(): number {
		return this._startDateTime.getTime();
	}
	public get endTimeNative(): number {
		return this._endDateTime.getTime();
	}

	@PrimaryGeneratedColumn()
	private _id: number;

	@Column()
	@Index()
	private _startDateTime: Date;

	@Column()
	@Index()
	private _endDateTime: Date;

	@Column({ default: 1 })
	private _capacity: number;

	@ManyToOne('ServiceProvider')
	@JoinColumn({ name: '_serviceProviderId' })
	private _serviceProvider: IServiceProvider;

	@Column()
	@Index()
	private _serviceProviderId: number;

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

	public get capacity(): number {
		return this._capacity;
	}

	public set capacity(value: number) {
		this._capacity = value;
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
}
