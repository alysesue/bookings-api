import { Inject, InRequestScope } from 'typescript-ioc';
import { TimeslotItemsRepository } from "./timeslotItems.repository";
import { mapToResponse } from './timeslotItems.mapper';
import { TimeslotsScheduleResponse } from './timeslotItems.apicontract';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { ServicesRepository } from '../services/services.repository';

@InRequestScope
export class TimeslotItemsService {
	@Inject
	private timeslotItemsRepository: TimeslotItemsRepository;
	@Inject
	private servicesRepository: ServicesRepository;

	public async getTimeslotItemsByServiceId(id: number): Promise<TimeslotsScheduleResponse> {
		if (!id) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service Id should not be empty');
		}

		const service = await this.servicesRepository.getService(id);
		if (!service) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service not found');
		}
		return mapToResponse(await this.timeslotItemsRepository.getTimeslotsScheduleById(service.timeslotsScheduleId));
	}
}
