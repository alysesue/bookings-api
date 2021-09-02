import { OneOffTimeslot } from '../../models/entities';
import { Validator } from '../../infrastructure/validator';
import { BusinessValidation } from '../../models';
import { concatIteratables } from '../../tools/asyncIterables';
import { OneOffTimeslotRequestV1 } from './oneOffTimeslots.apicontract';
import { ErrorCodeV2, MOLErrorV2 } from 'mol-lib-api-contract';
import { OneOffTimeslotsRepository } from './oneOffTimeslots.repository';
import { Inject, Scope, Scoped } from 'typescript-ioc';

@Scoped(Scope.Local)
export class OneOffTimeslotsValidation extends Validator<OneOffTimeslot> {
	@Inject
	private oneOffTimeslotsRepo: OneOffTimeslotsRepository;

	protected async *getValidations(entity: OneOffTimeslot): AsyncIterable<BusinessValidation> {
		const { startDateTime, endDateTime, title, description } = entity;
		const allValidates = concatIteratables(
			OneOffTimeslotsValidation.validateTitle(title),
			OneOffTimeslotsValidation.validateTime(startDateTime, endDateTime),
			OneOffTimeslotsValidation.validateDescription(description),
		);
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

	private static async *validateDescription(description: string): AsyncIterable<BusinessValidation> {
		if (description && description.length > 4000) {
			yield OneOffTimeslotsBusinessValidation.DescriptionTooLong;
		}
	}
	private static async *validateTitle(title: string): AsyncIterable<BusinessValidation> {
		if (title && title.length > 100) {
			yield OneOffTimeslotsBusinessValidation.TitleTooLong;
		}
	}
	private static async *validateTime(startDateTime: Date, endDateTime: Date): AsyncIterable<BusinessValidation> {
		if (startDateTime.getTime() >= endDateTime.getTime()) {
			yield OneOffTimeslotsBusinessValidation.InvalidTime;
		}
	}
}

class OneOffTimeslotsBusinessValidation {
	private constructor() {}

	public static readonly TitleTooLong = new BusinessValidation({
		code: '10101',
		message: `Title word limit is 100 characters`,
	});

	public static readonly InvalidTime = new BusinessValidation({
		code: '10102',
		message: `Start time must be less than end time`,
	});

	public static readonly DescriptionTooLong = new BusinessValidation({
		code: '10103',
		message: `Description word limit is 4000 characters`,
	});
}
