import { OneOffTimeslot } from '../../models/entities';
import { Validator } from '../../infrastructure/validator';
import { BusinessValidation } from '../../models';
import { concatIteratables } from '../../tools/asyncIterables';
import { OneOffTimeslotRequestV1 } from './oneOffTimeslots.apicontract';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { OneOffTimeslotsRepository } from './oneOffTimeslots.repository';
import { Inject, Scope, Scoped } from 'typescript-ioc';
import { ErrorsRef } from '../../errors/errors.ref';

@Scoped(Scope.Local)
export class OneOffTimeslotsValidation extends Validator<OneOffTimeslot> {
	@Inject
	private oneOffTimeslotsRepo: OneOffTimeslotsRepository;

	public async *getValidations(entity: OneOffTimeslot): AsyncIterable<BusinessValidation> {
		const { startDateTime, endDateTime } = entity;
		const allValidates = concatIteratables(OneOffTimeslotsValidation.validateTime(startDateTime, endDateTime));
		for await (const validation of allValidates) {
			yield validation;
		}
	}

	public async validateOneOffTimeslotsAvailability(request: OneOffTimeslotRequestV1, updateSlotId?: number) {
		const searchRequest = {
			serviceProviderIds: [request.serviceProviderId],
			startDateTime: request.startDateTime,
			endDateTime: request.endDateTime,
		};
		let slotAvailableArr = await this.oneOffTimeslotsRepo.search(searchRequest);
		slotAvailableArr = slotAvailableArr.filter((slot) => slot.id !== updateSlotId);

		if (slotAvailableArr.length > 0) {
			throw new MOLErrorV2(ErrorCodeV2.SYS_INVALID_PARAM).setMessage(
				`Slot cannot be created as it overlaps with an existing slot.`,
			);
		}
		return true;
	}

	private static async *validateTime(startDateTime: Date, endDateTime: Date): AsyncIterable<BusinessValidation> {
		if (startDateTime.getTime() >= endDateTime.getTime()) {
			yield OneOffTimeslotsBusinessValidation.InvalidTime;
		}
	}
}

class OneOffTimeslotsBusinessValidation {
	private static errors = ErrorsRef().oneOffTimeslot;

	public static readonly InvalidTime = new BusinessValidation(OneOffTimeslotsBusinessValidation.errors.invalidTime);
}
