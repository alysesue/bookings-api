import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { IService } from '../interfaces';

@Entity()
export class ServiceAdminGroupMap {
	@PrimaryColumn()
	private _serviceId: number;

	public set serviceId(value: number) {
		this._serviceId = value;
	}

	public get serviceId() {
		return this._serviceId;
	}

	@OneToOne('Service', { nullable: false })
	@JoinColumn({ name: '_serviceId' })
	public _service: IService;

	@Column({ type: 'varchar', length: 1000, nullable: false })
	@Index({ unique: true })
	private _serviceOrganisationRef: string;

	public set serviceOrganisationRef(value: string) {
		this._serviceOrganisationRef = value;
	}

	public get serviceOrganisationRef() {
		return this._serviceOrganisationRef;
	}

	public static create(serviceOrganisationRef: string) {
		const serviceGroupMap = new ServiceAdminGroupMap();
		serviceGroupMap._serviceOrganisationRef = serviceOrganisationRef;
		return serviceGroupMap;
	}

	public static createServiceOrganisationRef(serviceRef: string, organisationRef: string) {
		return `${serviceRef}:${organisationRef}`;
	}
}
