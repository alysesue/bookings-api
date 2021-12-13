import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IBooking } from '../interfaces';
import {OneOffTimeslot} from "./oneOffTimeslot";

@Entity()
export class BookedSlot {
	@PrimaryGeneratedColumn()
	private _id: number;

	@Column({ nullable: false })
	@Index()
	private _bookingId: number;

	@ManyToOne('Booking', { nullable: true, orphanedRowAction: 'delete' })
	@JoinColumn({ name: '_bookingId' })
	public booking: IBooking;

	@Column({ nullable: true })
	@Index()
	private _oneOffTimeslotId: number;

	@ManyToOne(() => OneOffTimeslot, { nullable: true })
	@JoinColumn({ name: '_oneOffTimeslotId' })
	private _oneOffTimeslot: OneOffTimeslot;

	public get id(): number {
		return this._id;
	}

	public get bookingId(): number {
		return this._bookingId;
	}

	public set bookingId(bookingId) {
		this._bookingId = bookingId;
	}

	public get oneOffTimeslotId(): number {
		return this._oneOffTimeslotId;
	}

	public set oneOffTimeslotId(oneOffTimeslotId: number) {
		this._oneOffTimeslotId = oneOffTimeslotId;
	}

	public get oneOffTimeslot(): OneOffTimeslot {
		return this._oneOffTimeslot;
	}

	public set oneOffTimeslot(oneOffTimeslot: OneOffTimeslot) {
		this._oneOffTimeslot = oneOffTimeslot;
	}
}
