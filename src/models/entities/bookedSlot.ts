import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IBooking, IServiceProvider } from '../interfaces';
import { ServiceProvider } from './serviceProvider';

@Entity()
export class BookedSlot {
	@PrimaryGeneratedColumn()
	private _id: number;

	@Column()
	@Index()
	private _startDateTime: Date;

	@Column()
	@Index()
	private _endDateTime: Date;

	@Column({ nullable: false })
	@Index()
	private _bookingId: number;

	@ManyToOne('Booking', { nullable: true, orphanedRowAction: 'delete' })
	@JoinColumn({ name: '_bookingId' })
	public booking: IBooking;

	@Column({ nullable: true })
	@Index()
	private _serviceProviderId: number;

	@ManyToOne(() => ServiceProvider, { nullable: true })
	@JoinColumn({ name: '_serviceProviderId' })
	private _serviceProvider: IServiceProvider;

	public get id(): number {
		return this._id;
	}

	public get bookingId(): number {
		return this._bookingId;
	}

	public set bookingId(bookingId) {
		this._bookingId = bookingId;
	}

	public get startDateTime(): Date {
		return this._startDateTime;
	}

	public set startDateTime(startDateTime) {
		this._startDateTime = startDateTime;
	}

	public get endDateTime(): Date {
		return this._endDateTime;
	}

	public set endDateTime(endDateTime) {
		this._endDateTime = endDateTime;
	}

	public get serviceProviderId(): number {
		return this._serviceProviderId;
	}

	public set serviceProviderId(serviceProviderId: number) {
		this._serviceProviderId = serviceProviderId;
	}

	public get serviceProvider(): IServiceProvider {
		return this._serviceProvider;
	}

	public set serviceProvider(serviceProvider: IServiceProvider) {
		this._serviceProvider = serviceProvider;
	}
}
