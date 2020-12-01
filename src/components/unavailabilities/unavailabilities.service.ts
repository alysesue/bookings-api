import { Inject, InRequestScope } from 'typescript-ioc';
import { UnavailabilitiesRepository } from './unavailabilities.repository';
import { UnavailabilityRequest } from './unavailabilities.apicontract';
import { Unavailability } from '../../models';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { ServiceProvidersRepository } from '../serviceProviders/serviceProviders.repository';
import { UserContext } from '../../infrastructure/auth/userContext';
import { UnavailabilitiesActionAuthVisitor } from './unavailabilities.auth';
import { ServicesRepository } from '../services/services.repository';
import { CrudAction } from '../../enums/crudAction';

@InRequestScope
export class UnavailabilitiesService {
	@Inject
	private unavailabilitiesRepository: UnavailabilitiesRepository;
	@Inject
	private serviceProvidersRepository: ServiceProvidersRepository;
	@Inject
	private servicesRepository: ServicesRepository;
	@Inject
	private userContext: UserContext;

	private async verifyActionPermission(unavailability: Unavailability, action: CrudAction): Promise<void> {
		const authGroups = await this.userContext.getAuthGroups();
		if (!new UnavailabilitiesActionAuthVisitor(unavailability, action).hasPermission(authGroups)) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_AUTHORIZATION).setMessage(
				`User cannot perform this action for this unavailability.`,
			);
		}
	}

	public async create(request: UnavailabilityRequest): Promise<Unavailability> {
		const entity = await this.mapToEntity(request, Unavailability.create());
		await this.verifyActionPermission(entity, CrudAction.Create);
		return await this.unavailabilitiesRepository.save(entity);
	}

	private async mapToEntity(request: UnavailabilityRequest, entity: Unavailability): Promise<Unavailability> {
		if (request.startTime.getTime() >= request.endTime.getTime()) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				'Unavailability start time must be less than end time.',
			);
		}

		entity.start = request.startTime;
		entity.end = request.endTime;

		if (!entity.id) {
			entity.serviceId = request.serviceId;
			entity.service = await this.servicesRepository.getService({ id: entity.serviceId });
		}

		if (request.allServiceProviders) {
			entity.allServiceProviders = true;
			entity.serviceProviders = [];
		} else {
			entity.allServiceProviders = false;
			if (request.serviceProviderIds && request.serviceProviderIds.length > 0) {
				entity.serviceProviders = await this.serviceProvidersRepository.getServiceProviders({
					ids: request.serviceProviderIds,
					serviceId: request.serviceId,
				});
				const notFound = request.serviceProviderIds.filter(
					(id) => !entity.serviceProviders.find((sp) => sp.id === id),
				);
				if (notFound.length > 0) {
					throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
						'Invalid service provider id(s): ' + notFound.join(', '),
					);
				}
			} else {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
					'Unavailability must be applied to at least one service provider (or all).',
				);
			}
		}

		return entity;
	}

	public async search(options: {
		from: Date;
		to: Date;
		serviceId: number;
		serviceProviderId?: number;
		// skipAuthorisation?: boolean;
	}): Promise<Unavailability[]> {
		return await this.unavailabilitiesRepository.search(options);
	}

	public async isUnavailable(params: {
		from: Date;
		to: Date;
		serviceId: number;
		serviceProviderId: number;
		// skipAuthorisation?: boolean;
	}): Promise<boolean> {
		const count = await this.unavailabilitiesRepository.searchCount(params);
		return count > 0;
	}

	public async deleteUnavailability(id: number): Promise<void> {
		const entity = await this.unavailabilitiesRepository.get({ id });
		if (!entity) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage(`Unavailability entry not found.`);
		}

		await this.verifyActionPermission(entity, CrudAction.Delete);
		await this.unavailabilitiesRepository.delete(entity);
	}
}
