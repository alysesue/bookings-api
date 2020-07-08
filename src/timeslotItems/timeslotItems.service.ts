import { Inject, InRequestScope } from 'typescript-ioc';
import { TimeslotItemsRepository } from "./timeslotItems.repository";
import { mapToResponse } from './timeslotItems.mapper';
import { TimeslotsScheduleResponse } from './timeslotItems.apicontract';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';

@InRequestScope
export class TimeslotItemsService {
	@Inject
	private timeslotItemsRepository: TimeslotItemsRepository;

	public async getTimeslotItemsByServiceId(id: number): Promise<TimeslotsScheduleResponse> {
		if (id !== null) {
			return mapToResponse(await this.timeslotItemsRepository.getTimeslotsScheduleById({ serviceId: id }));
		}
		else {
			throw new MOLErrorV2(ErrorCodeV2.SYS_NOT_FOUND).setMessage('Service Id should not be empty');
		}
	}
}
