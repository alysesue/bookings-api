import { InRequestScope } from 'typescript-ioc';
import {BookedSlot, Booking, Event} from '../../models';
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
	//
	// public async update(bookingList: Booking[], event: Event): Promise<void> {
	// 	if (!bookingList || !event) return null;
	// 	const repository = await this.getRepository();
	// 	const updatedBookedSlots : BookedSlot[] = [];
	// 	for (let i = 0; i<bookingList.length; i++) {
	// 		const previousBookedSlots = await this.getBookedSlotByBooking(bookingList[i].id)
	// 		for (let j = 0; j<previousBookedSlots.length; i++) {
	// 			await repository.delete(previousBookedSlots[j].id);
	// 		}
	// 		for (let j = 0; j<event.oneOffTimeslots.length; i++) {
	// 			let updatedBookedSlot = new BookedSlot()
	// 			updatedBookedSlot.oneOffTimeslotId = event.oneOffTimeslots[i].id;
	// 			updatedBookedSlot.bookingId = bookingList[i].id;
	// 			updatedBookedSlots.push(updatedBookedSlot);
	// 		}
	// 	}
	// 	await repository.save(updatedBookedSlots);
	// }

	public async getBookedSlotByBooking(bookingId: number): Promise<BookedSlot[]> {
		const repository = await this.getRepository();

		return await repository.find({
			where: {
				_bookingId: bookingId,
			},
		});
	}
}
