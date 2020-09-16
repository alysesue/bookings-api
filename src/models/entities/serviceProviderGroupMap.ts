import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { IServiceProvider } from '../interfaces';

@Entity()
export class ServiceProviderGroupMap {
	@PrimaryColumn()
	private _serviceProviderId: number;

	public set serviceProviderId(value: number) {
		this._serviceProviderId = value;
	}

	public get organisationId() {
		return this._serviceProviderId;
	}

	@OneToOne('ServiceProvider', { nullable: false })
	@JoinColumn({ name: '_serviceProviderId' })
	public _serviceProvider: IServiceProvider;

	@Column({ type: 'uuid' })
	@Index({ unique: true })
	private _molAdminId: string;

	public set molAdminId(value: string) {
		this._molAdminId = value;
	}

	public get molAdminId() {
		return this._molAdminId;
	}
}
