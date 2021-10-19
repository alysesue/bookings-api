import { OneOffTimeslotsRepository } from '../oneOffTimeslots.repository';
import { OneOffTimeslot } from '../../../models/entities';

export class OneOffTimeslotsRepositoryMock implements Partial<OneOffTimeslotsRepository> {
	public static search = jest.fn<Promise<OneOffTimeslot[]>, any>();
	public static delete = jest.fn();

	public async search(...params): Promise<any> {
		return await OneOffTimeslotsRepositoryMock.search(...params);
	}

	public async delete(...params): Promise<any> {
		return await OneOffTimeslotsRepositoryMock.delete(...params);
	}
}
