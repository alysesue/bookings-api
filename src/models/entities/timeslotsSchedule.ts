import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TimeslotItem } from "./timeslotItem";
import { IService, IServiceProvider, ITimeslotsSchedule } from "../interfaces";

@Entity()
export class TimeslotsSchedule implements ITimeslotsSchedule {
	constructor() {
	}

	@PrimaryGeneratedColumn()
	public _id: number;

	public _service: IService;
	public get service(): IService {
		return this._service;
	}

	public _serviceProvider: IServiceProvider;
	public get serviceProvider(): IServiceProvider {
		return this._serviceProvider;
	}

	@OneToMany(type => TimeslotItem, timeslot => timeslot._timeslotsSchedule)
	public timeslotItems: TimeslotItem[];
}
