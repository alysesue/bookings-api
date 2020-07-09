import { InRequestScope } from "typescript-ioc";
import { RepositoryBase } from "../core/repository";
import { TimeslotItem } from "../models";


@InRequestScope
export class TimeslotItemsRepository extends RepositoryBase<TimeslotItem> {

	constructor() {
		super(TimeslotItem);
	}

	public async saveTimeslotItem(data: TimeslotItem): Promise<TimeslotItem> {
		if (!data)
			return null;
		const repository = await this.getRepository();
		await repository.save(data);
		return data;
	}


}
