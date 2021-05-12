import { OneOffTimeslotsRepository } from '../oneOffTimeslots.repository';
import { OneOffTimeslot } from '../../../models/entities';

export class OneOffTimeslotsRepositoryMock implements Partial<OneOffTimeslotsRepository> {
	public static search = jest.fn<Promise<OneOffTimeslot[]>, any>();

	public async search(...params): Promise<any> {
		return await OneOffTimeslotsRepositoryMock.search(...params);
	}
}