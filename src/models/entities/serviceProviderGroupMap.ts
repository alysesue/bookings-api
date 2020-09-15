import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IServiceProvider } from '../interfaces';

@Entity()
export class ServiceProviderGroupMap {
	@PrimaryGeneratedColumn()
	private _id: number;

	public set id(id: number) {
		this._id = id;
	}

	public get id(): number {
		return this._id;
	}

	@Column({ type: 'uuid' })
	@Index({ unique: true })
	private _molAdminId: string;

	public set molAdminId(value: string) {
		this._molAdminId = value;
	}

	public get molAdminId() {
		return this._molAdminId;
	}

	@Column({ nullable: false })
	@Index()
	private _serviceProviderId: number;

	@OneToOne('ServiceProvider', { nullable: false })
	@JoinColumn({ name: '_serviceProviderId' })
	public _serviceProvider: IServiceProvider;
}
