import { TimeslotsSchedule } from '../../../models/entities';
import { TimeslotsScheduleRepository } from '../timeslotsSchedule.repository';

export class TimeslotsScheduleRepositoryMock implements Partial<TimeslotsScheduleRepository> {
	public static createTimeslotsScheduleMock: TimeslotsSchedule;
	public static getTimeslotsScheduleById = jest.fn<Promise<TimeslotsSchedule>, any>();
	public static populateTimeslotsSchedules = jest.fn<Promise<any>, any>();
	public static deleteTimeslotsSchedule = jest.fn();

	public async getTimeslotsScheduleById(...params): Promise<any> {
		return await TimeslotsScheduleRepositoryMock.getTimeslotsScheduleById(...params);
	}
	public async createTimeslotsSchedule(): Promise<TimeslotsSchedule> {
		return Promise.resolve(TimeslotsScheduleRepositoryMock.createTimeslotsScheduleMock);
	}
	public async populateTimeslotsSchedules(...params): Promise<any> {
		return await TimeslotsScheduleRepositoryMock.populateTimeslotsSchedules(...params);
	}
	public async deleteTimeslotsSchedule(...params): Promise<any> {
		return await TimeslotsScheduleRepositoryMock.deleteTimeslotsSchedule(...params);
	}
}
