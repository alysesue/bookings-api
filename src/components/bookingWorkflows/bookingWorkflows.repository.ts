import { RepositoryBase } from '../../core/repository';
import { InRequestScope } from 'typescript-ioc';
import { BookingWorkflow } from '../../models';

@InRequestScope
export class BookingWorkflowsRepository extends RepositoryBase<BookingWorkflow> {
	constructor() {
		super(BookingWorkflow);
	}

	public async save(entry: BookingWorkflow): Promise<BookingWorkflow> {
		const repository = await this.getRepository();
		return await repository.save(entry);
	}
}
