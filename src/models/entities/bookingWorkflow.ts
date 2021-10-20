import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IBooking } from '../interfaces';

export enum BookingWorkflowName {
	OnHoldReschedule = 'onHoldReschedule',
}

@Entity()
export class BookingWorkflow {
	@PrimaryGeneratedColumn()
	private _id: number;

	@ManyToOne('Booking', { nullable: false })
	@JoinColumn({ name: '_targetId' })
	public _target: IBooking;

	@Column({ nullable: false })
	@Index()
	private _targetId: number;

	@OneToOne('Booking', { nullable: false })
	@JoinColumn({ name: '_onHoldRescheduleId' })
	public _onHoldReschedule: IBooking;

	@Column({ nullable: false })
	@Index()
	private _onHoldRescheduleId: number;

	@Column({ type: 'enum', enum: BookingWorkflowName, nullable: false })
	private _type: BookingWorkflowName;

	public get id(): number {
		return this._id;
	}

	public get target(): IBooking {
		return this._target;
	}

	public get targetId(): number {
		return this._targetId;
	}

	public get onHoldReschedule(): IBooking {
		return this._onHoldReschedule;
	}

	public get onHoldRescheduleId(): number {
		return this._onHoldRescheduleId;
	}

	public get type(): BookingWorkflowName {
		return this._type;
	}

	public static createOnHoldReschedule({
		target,
		onHoldReschedule,
	}: {
		target: IBooking;
		onHoldReschedule: IBooking;
	}): BookingWorkflow {
		const instance = new BookingWorkflow();

		instance._target = target;
		instance._onHoldReschedule = onHoldReschedule;
		instance._type = BookingWorkflowName.OnHoldReschedule;
		return instance;
	}
}
