import * as _ from "lodash";
import { Inject, InRequestScope } from 'typescript-ioc';
import { UnavailabilitiesRepository } from "./unavailabilities.repository";
import { UnavailabilityRequest } from "./unavailabilities.apicontract";
import { Unavailability } from "../models";
import { ErrorCodeV2, MOLErrorV2 } from "mol-lib-api-contract";
import { ServiceProvidersRepository } from "../serviceProviders/serviceProviders.repository";

@InRequestScope
export class UnavailabilitiesService {
	@Inject
	private unavailabilitiesRepository: UnavailabilitiesRepository;
	@Inject
	private serviceProvidersRepository: ServiceProvidersRepository;

	private async mapToEntity(request: UnavailabilityRequest, entity: Unavailability): Promise<Unavailability> {
		if (request.start > request.end) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Unavailability start time must be less than end time.');
		}

		entity.start = request.start;
		entity.end = request.end;

		if (!entity.id) {
			entity.serviceId = request.serviceId;
		}

		if (request.allServiceProviders) {
			entity.allServiceProviders = true;
			entity.serviceProviders = [];
		} else {
			entity.allServiceProviders = false;
			if (request.serviceProviderIds) {
				entity.serviceProviders = await this.serviceProvidersRepository.getServiceProvidersByIds({ ids: request.serviceProviderIds, serviceId: request.serviceId });
				const notFound = request.serviceProviderIds.filter(id => !entity.serviceProviders.find(sp => sp.id === id));
				if (notFound.length > 0) {
					throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Invalid service provider id(s): ' + notFound.join(', '));
				}
			}

			if (!request.serviceProviderIds || entity.serviceProviders.length === 0) {
				throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage('Unavailability must be applied to at least one service provider (or all).');
			}
		}

		return entity;
	}

	public async create(request: UnavailabilityRequest): Promise<Unavailability> {
		const entity = await this.mapToEntity(request, Unavailability.create());
		const saved = await this.unavailabilitiesRepository.save(entity);

		return saved;
	}
}
