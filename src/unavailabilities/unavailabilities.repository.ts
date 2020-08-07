import { InRequestScope } from "typescript-ioc";
import { RepositoryBase } from "../core/repository";
import { Unavailability } from "../models";
import { SelectQueryBuilder } from "typeorm";

@InRequestScope
export class UnavailabilitiesRepository extends RepositoryBase<Unavailability> {
	constructor() {
		super(Unavailability);
	}

	public async save(data: Unavailability): Promise<Unavailability> {
		const repository = await this.getRepository();
		return await repository.save(data);
	}

	private async createSearchQuery({ from, to, serviceId, serviceProviderId }:
		{
			from: Date,
			to: Date,
			serviceId: number,
			serviceProviderId?: number,
		}): Promise<SelectQueryBuilder<Unavailability>> {

		const serviceCondition = 'u."_serviceId" = :serviceId';
		const dateRangeCondition = 'u."_start" <= :to AND u."_end" >= :from';
		const spCondition = serviceProviderId ?
			'(u."_allServiceProviders" AND EXISTS(SELECT 1 FROM public.service_provider esp WHERE esp."_id" = :serviceProviderId AND esp."_serviceId" = u."_serviceId")) OR '
			+ 'EXISTS(SELECT 1 FROM public.unavailable_service_provider usp WHERE usp."unavailability_id" = u."_id" AND usp."serviceProvider_id" = :serviceProviderId)'
			: '';

		const repository = (await this.getRepository());
		const query = repository.createQueryBuilder("u")
			.where([serviceCondition, dateRangeCondition, spCondition]
				.filter(s => s).map(s => `(${s})`).join(' AND '),
				{ from, to, serviceId, serviceProviderId });

		return query;
	}

	public async search(options:
		{
			from: Date,
			to: Date,
			serviceId: number,
			serviceProviderId?: number,
		}): Promise<Unavailability[]> {

		const query = await this.createSearchQuery(options);

		return await query
			.leftJoinAndSelect("u._serviceProviders", "sp_relation")
			.getMany();
	}

	public async searchCount(options:
		{
			from: Date,
			to: Date,
			serviceId: number,
			serviceProviderId?: number,
		}): Promise<number> {

		const query = await this.createSearchQuery(options);
		return await query.getCount();
	}
}
