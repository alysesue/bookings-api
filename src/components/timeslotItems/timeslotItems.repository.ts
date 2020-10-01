import { DeleteResult } from 'typeorm';
import { InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { TimeslotItem } from '../../models';

@InRequestScope
export class TimeslotItemsRepository extends RepositoryBase<TimeslotItem> {
	constructor() {
		super(TimeslotItem);
	}

	public async saveTimeslotItem(data: TimeslotItem): Promise<TimeslotItem> {
		if (!data) return null;
		const repository = await this.getRepository();
		return await repository.save(data);
	}

	public async saveTimeslotItems(data: TimeslotItem[]): Promise<TimeslotItem[]> {
		if (!data) return null;
		const repository = await this.getRepository();
		return await repository.save(data);
	}

	public async deleteTimeslotItem(id: number): Promise<DeleteResult> {
		const repository = await this.getRepository();
		return await repository.delete(id);
	}

	public async getTimeslotItem(id: number): Promise<TimeslotItem> {
		if (!id) return null;
		const repository = await this.getRepository();
		const entry = await repository.findOne(id);
		return entry;
	}
}
