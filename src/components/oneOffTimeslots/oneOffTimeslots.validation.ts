import { OneOffTimeslot } from '../../models/entities';
import { Validator } from '../../infrastructure/validator';
import { BusinessValidation } from '../../models';
import { concatIteratables } from '../../tools/asyncIterables';

export class OneOffTimeslotsValidation extends Validator<OneOffTimeslot> {
	protected async *getValidations(entity: OneOffTimeslot) {
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

export class OneOffTimeslotsBusinessValidation {
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
