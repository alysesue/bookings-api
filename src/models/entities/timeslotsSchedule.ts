import { Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IService, IServiceProvider, ITimeslotsSchedule } from '../interfaces';
import { TimeslotGenerator } from '../timeslotGenerator';
import { TimeslotWithCapacity } from '../timeslotWithCapacity';
import { TimeslotItem } from './timeslotItem';

@Entity()
export class TimeslotsSchedule implements ITimeslotsSchedule {
	constructor() {}

	@PrimaryGeneratedColumn()
	public _id: number;

	@OneToOne('Service', '_timeslotsSchedule')
	public _service: IService;
	public get service(): IService {
		return this._service;
	}

	@OneToOne('ServiceProvider', '_timeslotsSchedule')
	public _serviceProvider: IServiceProvider;
	public get serviceProvider(): IServiceProvider {
		return this._serviceProvider;
	}

	@OneToMany(() => TimeslotItem, (timeslot) => timeslot._timeslotsSchedule, {
		cascade: true,
	})
	public timeslotItems: TimeslotItem[];

	public static create(service: IService, serviceProvider: IServiceProvider): TimeslotsSchedule {
		const instance = new TimeslotsSchedule();
		if (service) instance._service = service;
		if (serviceProvider) instance._serviceProvider = serviceProvider;
		return instance;
	}

	public intersectsAnyExceptThis(timeslotItem: TimeslotItem) {
		for (const entry of this.timeslotItems || []) {
			if (entry._id === timeslotItem._id) continue;

			if (entry.intersects(timeslotItem)) return true;
		}
		return false;
	}

	// tslint:disable-next-line: cognitive-complexity
	public generateValidTimeslots(range: { startDatetime: Date; endDatetime: Date }): Iterable<TimeslotWithCapacity> {
		return new TimeslotGenerator(this.timeslotItems).generateValidTimeslots(range);
	}
}
