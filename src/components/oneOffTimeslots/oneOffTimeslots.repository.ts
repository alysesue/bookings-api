import { Inject, InRequestScope } from 'typescript-ioc';
import { SelectQueryBuilder } from 'typeorm';
import { RepositoryBase } from '../../core/repository';
import { OneOffTimeslot } from '../../models';
import { UserContext } from '../../infrastructure/auth/userContext';
import { andWhere, orWhere } from '../../tools/queryConditions';
import { OneOffTimeslotsQueryAuthVisitor } from './oneOffTimeslots.auth';
import { LabelOperationFiltering } from '../labels/label.enum';

@InRequestScope
export class OneOffTimeslotsRepository extends RepositoryBase<OneOffTimeslot> {
	@Inject
	private userContext: UserContext;

	constructor() {
		super(OneOffTimeslot);
	}
	public async create(data: OneOffTimeslot[]): Promise<OneOffTimeslot[]> {
		return (await this.getRepository()).create(data);
	}

	public async save(data: OneOffTimeslot[]): Promise<OneOffTimeslot[]> {
		if (!data) return null;
		const repository = await this.getRepository();
		return await repository.save(data);
	}

	private async createSelectQuery(
		queryFilters: string[],
		queryParams: {},
		options: {
			byPassAuth?: boolean;
		},
	): Promise<SelectQueryBuilder<OneOffTimeslot>> {
		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = options.byPassAuth
			? { userCondition: '', userParams: {} }
			: await new OneOffTimeslotsQueryAuthVisitor('serviceProvider', 'SPservice').createUserVisibilityCondition(
					authGroups,
			  );
		const repository = await this.getRepository();

		const whereConditions = andWhere([userCondition, ...queryFilters]);
		const whereParam = { ...userParams, ...queryParams };

		return repository
			.createQueryBuilder('timeslot')
			.where(whereConditions, whereParam)
			.leftJoin('timeslot._serviceProvider', 'serviceProvider')
			.leftJoin('serviceProvider._service', 'SPservice');
	}

	public async getById(request: { id: number; byPassAuth?: boolean }): Promise<OneOffTimeslot> {
		const idCondition = 'timeslot._id = :id';
		const query = await this.createSelectQuery([idCondition], { id: request.id }, request);

		return await query.getOne();
	}

	public async search(request: {
		byPassAuth?: boolean;
		serviceId?: number;
		serviceProviderIds?: number[];
		startDateTime?: Date;
		endDateTime?: Date;
		labelIds?: number[];
		labelOperationFiltering?: LabelOperationFiltering;
	}): Promise<OneOffTimeslot[]> {
		const {
			serviceId,
			serviceProviderIds,
			startDateTime,
			endDateTime,
			labelIds,
			labelOperationFiltering,
		} = request;

		const serviceCondition = serviceId ? '"serviceProvider"."_serviceId" = :serviceId' : '';
		const spCondition =
			serviceProviderIds && serviceProviderIds.length > 0
				? 'timeslot."_serviceProviderId" IN (:...serviceProviderIds)'
				: '';

		const startDateCondition = startDateTime ? 'timeslot."_endDateTime" > :startDateTime' : '';
		const endDateCondition = endDateTime ? 'timeslot."_startDateTime" < :endDateTime' : '';
		const labelsCondition =
			labelIds && labelIds.length > 0
				? labelIds.map(
						(_, index) =>
							`timeslot."_id" IN (SELECT "oneOffTimeslot_id" FROM oneofftimeslot_label WHERE "label_id" = :label_${index})`,
				  )
				: [];

		const labelsParam = {};
		if (labelIds && labelIds.length > 0) {
			labelIds.forEach((labelId, index) => (labelsParam[`label_${index}`] = labelId));
		}

		let labelsConditionsString;
		if (labelOperationFiltering === LabelOperationFiltering.UNION) {
			labelsConditionsString = labelsCondition.length ? orWhere(labelsCondition) : '';
		} else {
			labelsConditionsString = labelsCondition.length ? andWhere(labelsCondition) : '';
		}

		const query = await this.createSelectQuery(
			[serviceCondition, spCondition, startDateCondition, endDateCondition, labelsConditionsString],
			{ serviceId, serviceProviderIds, startDateTime, endDateTime, ...labelsParam },
			{ ...request },
		);

		return await query.getMany();
	}

	public async delete(timeslots: OneOffTimeslot[]): Promise<void> {
		const repository = await this.getRepository();
		await timeslots.map((slot) => repository.delete(slot.id));
	}
}
