import { BookingWorkflow } from '../../../models/entities';
import { BookingWorkflowsRepository } from '../bookingWorkflows.repository';

export class BookingWorkflowsRepositoryMock implements Partial<BookingWorkflowsRepository> {
	public static save = jest.fn<Promise<BookingWorkflow>, any>();

	public async save(...params): Promise<BookingWorkflow> {
		return await BookingWorkflowsRepositoryMock.save(...params);
	}
}
