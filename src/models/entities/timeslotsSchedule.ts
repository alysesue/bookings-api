import { BaseEntity, Column, Entity, OneToMany, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ServiceProvider } from './serviceProvider';
import { Service } from "./service";
import { TimeslotItem } from "./timeslotItem";
import { ITimeslotsSchedule } from "../interfaces";
@Entity()
export class TimeslotsSchedule implements ITimeslotsSchedule {
	constructor() {
	}

	@PrimaryGeneratedColumn()
	public _timeslotsScheduleId: number;

	@Column({ nullable: false })
	private _serviceId: number;

	public get serviceId(): number {
		return this._serviceId;
	}

	@ManyToOne(type => Service)
	@JoinColumn({ name: '_serviceId' })
	private _service: Service;

	public get service(): Service {
		return this._service;
	}

	@Column({ nullable: false })
	private _serviceProviderId?: number;

	@ManyToOne(type => ServiceProvider)
	@JoinColumn({ name: '_serviceProviderId' })
	private _serviceProvider: ServiceProvider;

	public get serviceProvider(): ServiceProvider {
		return this._serviceProvider;
	}

	@OneToMany(type => TimeslotItem, timeslot => timeslot._timeslotsSchedule, { cascade: true })
	public timeslot: TimeslotItem[];

}
