import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ServiceProvider } from './serviceProvider';
import { Service } from "./service";
import { TimeslotItem } from "./timeslotItem";
import { ITimeslotsSchedule } from "../interfaces";
import { Timeslot } from "../timeslot";
import { DateHelper } from "../../infrastructure/dateHelper";
import { groupByKey } from "../../tools/collections";
import { TimeOfDay } from "../timeOfDay";
@Entity()
export class TimeslotsSchedule implements ITimeslotsSchedule {
	constructor() {
	}

	@PrimaryGeneratedColumn()
	public _timeslotsScheduleId: number;

	@Column({ nullable: true })
	private _serviceId?: number;

	public get serviceId(): number {
		return this._serviceId;
	}

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

	private static sortTimeslots(a: TimeslotItem, b: TimeslotItem) {
		return a.startTime.AsMinutes() - b.startTime.AsMinutes();
	}
}
