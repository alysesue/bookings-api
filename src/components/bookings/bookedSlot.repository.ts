import { InRequestScope } from 'typescript-ioc';
import { BookedSlot } from '../../models';
import { RepositoryBase } from '../../core/repository';

@InRequestScope
export class BookedSlotRepository extends RepositoryBase<BookedSlot> {
	constructor() {
		super(BookedSlot);
	}

	public async save(data: BookedSlot[]): Promise<BookedSlot[]> {
		if (!data) return null;
		const repository = await this.getRepository();
		return await repository.save(data);
	}

	public async getBookedSlotByBooking(bookingId: number): Promise<BookedSlot[]> {
		const repository = await this.getRepository();
		return await repository.find({
			where: {
				_bookingId: bookingId,
			},
		});
	}
}
