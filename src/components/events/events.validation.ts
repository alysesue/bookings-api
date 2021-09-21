import { Inject, Scope, Scoped } from 'typescript-ioc';
import { Validator } from '../../infrastructure/validator';
import { Event } from '../../models/entities/event';
import { BusinessValidation, OneOffTimeslot } from '../../models';
import { concatIteratables } from '../../tools/asyncIterables';
import { ErrorsRef } from '../../errors/errors.ref';
import { OneOffTimeslotsValidation } from '../oneOffTimeslots/oneOffTimeslots.validation';

@Scoped(Scope.Local)
export class EventsValidation extends Validator<Event> {
	@Inject
	private oneOffTimeslotsValidation: OneOffTimeslotsValidation;

	protected async *getValidations(entity: Event): AsyncIterable<BusinessValidation> {
		const { title, description, oneOffTimeslots } = entity;
		const oneOffTimeslotsValidations = oneOffTimeslots
			? oneOffTimeslots.map((oneOffTimeslot) => this.oneOffTimeslotsValidation.getValidations(oneOffTimeslot))
			: [];
		const allValidates = concatIteratables(
			EventsValidation.validateTitle(title),
			EventsValidation.validateDescription(description),
			EventsValidation.atLeastOneSlot(oneOffTimeslots),
			EventsValidation.sameService(oneOffTimeslots),
			...oneOffTimeslotsValidations,
		);
		for await (const validation of allValidates) {
			yield validation;
		}
	}

	private static async *atLeastOneSlot(oneOffTimeslots: OneOffTimeslot[]): AsyncIterable<BusinessValidation> {
		if (!oneOffTimeslots?.length) {
			yield EventsBusinessValidation.AtLeastOneSlot;
		}
	}

	private static async *sameService(oneOffTimeslots: OneOffTimeslot[]): AsyncIterable<BusinessValidation> {
		if (oneOffTimeslots?.length) {
			const ids = oneOffTimeslots.map((e) => e.serviceProvider.serviceId);
			const sameId = ids.every((val, i, arr) => val === arr[0]);
			if (!sameId) {
				yield EventsBusinessValidation.SameService;
			}
		}
	}

	private static async *validateDescription(description: string): AsyncIterable<BusinessValidation> {
		if (description && description.length > 4000) {
			yield EventsBusinessValidation.DescriptionTooLong;
		}
	}
	private static async *validateTitle(title: string): AsyncIterable<BusinessValidation> {
		if (title && title.length > 100) {
			yield EventsBusinessValidation.TitleTooLong;
		}
	}
}

class EventsBusinessValidation {
	private static oneOffTimeslotError = ErrorsRef().oneOffTimeslot;

	public static readonly TitleTooLong = new BusinessValidation(
		EventsBusinessValidation.oneOffTimeslotError.titleTooLong,
	);

	public static readonly DescriptionTooLong = new BusinessValidation(
		EventsBusinessValidation.oneOffTimeslotError.descriptionTooLong,
	);

	public static readonly SameService = new BusinessValidation(
		EventsBusinessValidation.oneOffTimeslotError.sameService,
	);

	public static readonly AtLeastOneSlot = new BusinessValidation(
		EventsBusinessValidation.oneOffTimeslotError.atLeastOneSlot,
	);
}
