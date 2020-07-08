import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ServiceProvider } from './serviceProvider';
import { Service } from "./service";
import { TimeslotItem } from "./timeslotItem";
import { ITimeslotsSchedule } from "../interfaces";

@Entity()
export class TimeslotsSchedule implements ITimeslotsSchedule {
	constructor() {
	}

	@PrimaryGeneratedColumn()
	public _id: number;

	@Column({ nullable: true })
	public _serviceId?: number;

	@ManyToOne(type => Service)
	@JoinColumn({ name: '_serviceId' })
	private _service: Service;

	public get service(): Service {
		return this._service;
	}

	@Column({ nullable: true })
	private _serviceProviderId?: number;

	@ManyToOne(type => ServiceProvider)
	@JoinColumn({ name: '_serviceProviderId' })
	private _serviceProvider: ServiceProvider;

	public get serviceProvider(): ServiceProvider {
		return this._serviceProvider;
	}

	@OneToMany(type => TimeslotItem, timeslot => timeslot._timeslotsSchedule)
	public timeslotItems: TimeslotItem[];
}
