import { Unavailability } from '../../models/entities';
import { UnavailabilityResponseV1, UnavailabilityResponseV2 } from './unavailabilities.apicontract';
import { Inject } from 'typescript-ioc';
import { ServiceProvidersMapper } from '../serviceProviders/serviceProviders.mapper';
import { IdHasher } from '../../infrastructure/idHasher';

export class UnavailabilitiesMapperV1 {
	@Inject
	private serviceProvidersMapper: ServiceProvidersMapper;

	public mapToResponse(data: Unavailability): UnavailabilityResponseV1 {
		const serviceProviders = this.serviceProvidersMapper.mapSummaryDataModelsV1(data.serviceProviders);
		return {
			id: data.id,
			startTime: data.start,
			endTime: data.end,
			allServiceProviders: data.allServiceProviders,
			serviceProviders,
		};
	}
}

export class UnavailabilitiesMapperV2 {
	@Inject
	private serviceProvidersMapper: ServiceProvidersMapper;
	@Inject
	private idHasher: IdHasher;

	public mapToResponse(data: Unavailability): UnavailabilityResponseV2 {
		const serviceProviders = this.serviceProvidersMapper.mapSummaryDataModelsV2(data.serviceProviders);
		const signedUnavailabilityId = this.idHasher.encode(data.id);
		return {
			id: signedUnavailabilityId,
			startTime: data.start,
			endTime: data.end,
			allServiceProviders: data.allServiceProviders,
			serviceProviders,
		};
	}
}
