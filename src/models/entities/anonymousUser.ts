import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IUser } from '../interfaces';
import * as uuid from 'uuid';

@Entity()
export class AnonymousUser {
	constructor() {}

	@PrimaryGeneratedColumn()
	private _id: number;

	@OneToOne('User', { nullable: false })
	@JoinColumn({ name: '_userId' })
	public _User: IUser;

	public get id(): number {
		return this._id;
	}

	public set id(value: number) {
		this._id = value;
	}

	@Column({ type: 'uuid', nullable: false })
	@Index({ unique: true })
	private _trackingId: string;

	public get trackingId(): string {
		return this._trackingId;
	}

	public static create({ trackingId }: { trackingId?: string }): AnonymousUser | undefined {
		if (trackingId && !uuid.validate(trackingId)) {
			return null;
		}
		const instance = new AnonymousUser();
		instance._trackingId = trackingId || uuid.v4();
		return instance;
	}
}
