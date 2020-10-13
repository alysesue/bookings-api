import { DeleteResult } from 'typeorm';
import { Inject, InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { Service, ServiceProvider, TimeslotItem, TimeslotsSchedule } from '../../models';
import { UserContext } from "../../infrastructure/auth/userContext";
import { TimeslotItemsAuthQueryVisitor } from "./timeslotItems.auth";

@InRequestScope
export class TimeslotItemsRepository extends RepositoryBase<TimeslotItem> {

	@Inject
	private userContext: UserContext;

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
		const idCondition = 'timeslotItem."_id" = :id';
		const userCondition = new TimeslotItemsAuthQueryVisitor('service', 'serviceProvider')
			.createUserVisibilityCondition(await this.userContext.getAuthGroups());

		const query = repository
			.createQueryBuilder('timeslotItem')
			.where([idCondition, userCondition]
				.filter((c) => c)
				.map((c) => `(${ c })`)
				.join(' AND '), {id})
			.leftJoinAndSelect(TimeslotsSchedule, 'timeslotsSchedule', 'timeslotsSchedule.id = timeslotItem._timeslotsScheduleId')
			.leftJoinAndSelect(ServiceProvider, 'serviceProvider', 'serviceProvider._timeslotsScheduleId=timeslotsSchedule._id')
			.leftJoinAndSelect(Service, 'service', 'service._timeslotsScheduleId = timeslotsSchedule._id')
		return await query.getOne();
	}
}
