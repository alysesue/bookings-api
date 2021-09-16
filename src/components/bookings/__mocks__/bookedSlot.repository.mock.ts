import { BookedSlot } from '../../../models';
import { BookedSlotRepository } from '../bookedSlot.repository';

export class BookedSlotRepositoryMock implements Partial<BookedSlotRepository> {
	public async save(data: BookedSlot[]): Promise<BookedSlot[]> {
		return Promise.resolve(data);
	}
}
