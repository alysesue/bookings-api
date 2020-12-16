import { Inject, InRequestScope } from 'typescript-ioc';
import { RepositoryBase } from '../../core/repository';
import { Unavailability } from '../../models';
import { SelectQueryBuilder } from 'typeorm';
import { UserContext } from '../../infrastructure/auth/userContext';
import { ServiceProviderAuthGroup } from '../../infrastructure/auth/authGroup';
import { UnavailabilitiesQueryAuthVisitor } from './unavailabilities.auth';
import { andWhere } from '../../tools/queryConditions';
import { DefaultIsolationLevel } from '../../core/transactionManager';

@InRequestScope
export class UnavailabilitiesRepository extends RepositoryBase<Unavailability> {
	@Inject
	private userContext: UserContext;

	constructor() {
		super(Unavailability);
	}

	public async save(data: Unavailability): Promise<Unavailability> {
		const repository = await this.getRepository();
		return await repository.save(data);
	}

	private async createSelectQuery(
		queryFilters: string[],
		queryParams: {},
		options: {
			skipAuthorisation?: boolean;
		},
	) {
		const authGroups = await this.userContext.getAuthGroups();
		const { userCondition, userParams } = options.skipAuthorisation
			? { userCondition: '', userParams: {} }
			: await new UnavailabilitiesQueryAuthVisitor('u', 'service').createUserVisibilityCondition(authGroups);

		const repository = await this.getRepository();
		const query = repository
			.createQueryBuilder('u')
			.where(andWhere([userCondition, ...queryFilters]), { ...userParams, ...queryParams })
			.leftJoinAndSelect('u._service', 'service');

		return query;
	}

	private async createSearchQuery(options: {
		from: Date;
		to: Date;
		serviceId: number;
		serviceProviderId?: number;
		skipAuthorisation?: boolean;
	}): Promise<SelectQueryBuilder<Unavailability>> {
		const { from, to, serviceId, serviceProviderId } = options;

		const serviceCondition = 'u."_serviceId" = :serviceId';
		const dateRangeCondition = 'u."_start" < :to AND u."_end" > :from';
		const spCondition = serviceProviderId
			? '(u."_allServiceProviders" AND EXISTS(SELECT 1 FROM public.service_provider esp WHERE esp."_id" = :serviceProviderId AND esp."_serviceId" = u."_serviceId")) OR ' +
			  'EXISTS(SELECT 1 FROM public.unavailable_service_provider usp WHERE usp."unavailability_id" = u."_id" AND usp."serviceProvider_id" = :serviceProviderId)'
			: '';

		const query = await this.createSelectQuery(
			[serviceCondition, dateRangeCondition, spCondition],
			{ from, to, serviceId, serviceProviderId },
			options,
		);

		return query;
	}

	private async getServiceProviderAuthGroup(): Promise<ServiceProviderAuthGroup> {
		const authGroups = (await this.userContext.getAuthGroups()).filter(
			(g) => g instanceof ServiceProviderAuthGroup,
		);

		return authGroups.length > 0 ? (authGroups[0] as ServiceProviderAuthGroup) : null;
	}

	private async getServiceProviderRelationFilter(options: {
		skipAuthorisation?: boolean;
	}): Promise<{ condition: string; params: {} }> {
		const serviceProviderAuth = await this.getServiceProviderAuthGroup();
		if (options.skipAuthorisation || !serviceProviderAuth) {
			return { condition: '', params: {} };
		} else {
			return {
				condition: 'sp_relation._id = :relationServiceProviderId',
				params: { relationServiceProviderId: serviceProviderAuth.authorisedServiceProvider.id },
			};
		}
	}

	public async search(options: {
		from: Date;
		to: Date;
		serviceId: number;
		serviceProviderId?: number;
		skipAuthorisation?: boolean;
	}): Promise<Unavailability[]> {
		const query = await this.createSearchQuery(options);
		const spRelationFilter = await this.getServiceProviderRelationFilter(options);

		const entries = await query
			.leftJoinAndSelect(
				'u._serviceProviders',
				'sp_relation',
				spRelationFilter.condition,
				spRelationFilter.params,
			)
			.getMany();
		return entries;
	}

	public async searchCount(options: {
		from: Date;
		to: Date;
		serviceId: number;
		serviceProviderId?: number;
		skipAuthorisation?: boolean;
	}): Promise<number> {
		const query = await this.createSearchQuery(options);
		return await query.getCount();
	}

	public async get(options: { id: number; skipAuthorisation?: boolean }): Promise<Unavailability> {
		const { id } = options;
		if (!id) {
			return null;
		}
		const idCondition = 'u."_id" = :id';
		const spRelationFilter = await this.getServiceProviderRelationFilter(options);
		const query = await this.createSelectQuery([idCondition], { id }, options);

		const entry = await query
			.leftJoinAndSelect(
				'u._serviceProviders',
				'sp_relation',
				spRelationFilter.condition,
				spRelationFilter.params,
			)
			.getOne();
		return entry;
	}

	public async delete(unavailability: Unavailability): Promise<void> {
		await this.transactionManager.runInTransaction(DefaultIsolationLevel, async () => {
			const { id } = unavailability;
			const serviceProviderIds = unavailability.serviceProviders.map((sp) => sp.id);
			const repository = await this.getRepository();
			if (serviceProviderIds.length > 0) {
				await repository
					.createQueryBuilder()
					.delete()
					.from('public.unavailable_service_provider')
					.where('unavailability_id = :id AND "serviceProvider_id" IN (:...serviceProviderIds)', {
						id,
						serviceProviderIds,
					})
					.execute();
			}

			await repository
				.createQueryBuilder()
				.delete()
				.where(
					`_id = :id AND NOT EXISTS(SELECT 1 FROM public.unavailable_service_provider sp_relation WHERE sp_relation.unavailability_id = :id)`,
					{ id },
				)
				.execute();
		});
	}
}
