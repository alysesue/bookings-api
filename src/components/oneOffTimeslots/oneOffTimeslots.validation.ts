import { OneOffTimeslot } from '../../models/entities';
import { Validator } from '../../infrastructure/validator';
import { BusinessValidation } from '../../models';
import { concatIteratables } from '../../tools/asyncIterables';

export class OneOffTimeslotsValidation extends Validator<OneOffTimeslot> {
	protected async *getValidations(entity: OneOffTimeslot) {
		const { startDateTime, endDateTime, title, description } = entity;
		const allValidates = concatIteratables(
			OneOffTimeslotsValidation.validateDescription(description),
			OneOffTimeslotsValidation.validateTime(startDateTime, endDateTime),
			OneOffTimeslotsValidation.validateTitle(title),
		);
		for await (const validation of allValidates) {
			yield validation;
		}
	}
	private static async *validateDescription(description: string): AsyncIterable<BusinessValidation> {
		if (description && description.length > 4000) {
			yield OneOffTimeslotsBusinessValidation.DescriptionTooLong;
		}
	}
	private static async *validateTitle(title: string): AsyncIterable<BusinessValidation> {
		if (title && title.length > 100) {
			yield OneOffTimeslotsBusinessValidation.DescriptionTooLong;
		}
	}
	private static async *validateTime(startDateTime: Date, endDateTime: Date): AsyncIterable<BusinessValidation> {
		if (startDateTime.getTime() >= endDateTime.getTime()) {
			yield OneOffTimeslotsBusinessValidation.InvalidTime;
		}
	}
}

export class OneOffTimeslotsBusinessValidation {
	private constructor() {}

	public static readonly DescriptionTooLong = new BusinessValidation({
		code: '10101',
		message: `Description should be max 4000 characters`,
	});

	public static readonly TitleTooLong = new BusinessValidation({
		code: '10102',
		message: `Title should be max 100 character`,
	});

	public static readonly InvalidTime = new BusinessValidation({
		code: '10103',
		message: `Start time must be less than end time.`,
	});
}
