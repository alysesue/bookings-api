import { Booking, BookingStatus, BusinessValidation } from '../../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { BookingSearchQuery, BookingsRepository } from '../bookings.repository';
import { UnavailabilitiesService } from '../../unavailabilities/unavailabilities.service';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { isEmail, isSGUinfin } from 'mol-lib-api-contract/utils';
import { BusinessError } from '../../../errors/businessError';
import { concatIteratables, iterableToArray } from '../../../tools/asyncIterables';
import { BookingBusinessValidations } from './bookingBusinessValidations';
import { CaptchaService } from '../../captcha/captcha.service';
import { getConfig } from '../../../config/app-config';

export interface IValidator {
	validate(booking: Booking): Promise<void>;
}

@InRequestScope
abstract class BookingsValidator implements IValidator {
	@Inject
	private serviceProvidersRepository: ServiceProvidersRepository;

	public async validate(booking: Booking): Promise<void> {
		const validations = await iterableToArray(this.getValidations(booking));
		BusinessError.throw(validations);
	}

	private static async validateUinFin(citizenUinFin: string): Promise<boolean> {
		const validUinFin = await isSGUinfin(citizenUinFin);
		return validUinFin.pass;
	}

	private static async *validateCitizenDetails(booking: Booking): AsyncIterable<BusinessValidation> {
		if (!(await BookingsValidator.validateUinFin(booking.citizenUinFin))) {
			yield BookingBusinessValidations.CitizenUinFinNotFound;
		}
		if (!booking.citizenName) {
			yield BookingBusinessValidations.CitizenNameNotProvided;
		}
		if (!booking.citizenEmail) {
			yield BookingBusinessValidations.CitizenEmailNotProvided;
		} else if (!(await isEmail(booking.citizenEmail)).pass) {
			yield BookingBusinessValidations.CitizenEmailNotValid;
		}
	}

	private static async *validateDuration(booking: Booking): AsyncIterable<BusinessValidation> {
		const duration = Math.floor(DateHelper.DiffInMinutes(booking.endDateTime, booking.startDateTime));

		if (duration <= 0) {
			yield BookingBusinessValidations.EndTimeLesserThanStartTime;
		}
	}

	private static async *skipValidation(booking: Booking): AsyncIterable<BusinessValidation> {
		return;
	}

	public async *getValidations(booking: Booking): AsyncIterable<BusinessValidation> {
		let yieldedAny = false;

		if (!getConfig().isAutomatedTest) {
			for await (const validation of this.validateToken(booking)) {
				yield validation;
				return; // stops iterable (method scoped)
			}
		}

		for await (const validation of concatIteratables(
			this.validateServiceProviderExisting(booking),
			BookingsValidator.validateDuration(booking),
			booking.status === BookingStatus.OnHold
				? BookingsValidator.skipValidation(booking)
				: BookingsValidator.validateCitizenDetails(booking),
		)) {
			yieldedAny = true;
			yield validation;
		}

		if (yieldedAny) {
			return; // stops iterable (method scoped)
		}

		yield* this.validateAvailability(booking);
	}

	protected abstract validateAvailability(booking: Booking): AsyncIterable<BusinessValidation>;

	protected abstract validateToken(booking: Booking): AsyncIterable<BusinessValidation>;

	protected async *validateServiceProviderExisting(booking: Booking): AsyncIterable<BusinessValidation> {
		if (booking.serviceProviderId) {
			const provider = await this.serviceProvidersRepository.getServiceProvider({
				id: booking.serviceProviderId,
			});
			if (!provider) {
				yield BookingBusinessValidations.ServiceProviderNotFound(booking.serviceProviderId);
			}
		}
	}
}

@InRequestScope
class OutOfSlotBookingValidator extends BookingsValidator {
	@Inject
	private bookingsRepository: BookingsRepository;
	@Inject
	private unAvailabilitiesService: UnavailabilitiesService;
	@Inject
	private timeslotsService: TimeslotsService;

	protected async *validateServiceProviderExisting(booking: Booking): AsyncIterable<BusinessValidation> {
		if (!booking.serviceProviderId) {
			yield BookingBusinessValidations.OutOfSlotServiceProviderRequired;
			return;
		}

		yield* super.validateServiceProviderExisting(booking);
	}

	protected async *validateAvailability(booking: Booking): AsyncIterable<BusinessValidation> {
		const existingTimeslot = await this.timeslotsService.getAggregatedTimeslots(
			booking.startDateTime,
			booking.endDateTime,
			booking.serviceId,
			true,
			booking.serviceProviderId ? [booking.serviceProviderId] : undefined,
		);

		const timeslotOrBoookingExists = existingTimeslot.some(
			(i) =>
				DateHelper.equals(i.startTime, booking.startDateTime) &&
				DateHelper.equals(i.endTime, booking.endDateTime),
		);
		if (!timeslotOrBoookingExists && (await this.overlapsOtherAccepted(booking))) {
			yield BookingBusinessValidations.OverlapsAcceptedBooking;
			return; // stops iterable (method scoped)
		}

		if (await this.overlapsOtherOnHoldBooking(booking)) {
			yield BookingBusinessValidations.OverlapsOnHoldBooking;
			return; // stops iterable (method scoped)
		}

		if (
			await this.unAvailabilitiesService.isUnavailable({
				from: booking.startDateTime,
				to: booking.endDateTime,
				serviceId: booking.serviceId,
				serviceProviderId: booking.serviceProviderId,
				skipAuthorisation: true,
			})
		) {
			yield BookingBusinessValidations.ServiceProviderNotAvailable;
		}
	}

	private async overlapsOtherOnHoldBooking(booking: Booking): Promise<boolean> {
		const searchQuery: BookingSearchQuery = {
			from: booking.startDateTime,
			to: booking.endDateTime,
			statuses: [BookingStatus.OnHold],
			serviceId: booking.serviceId,
			serviceProviderId: booking.serviceProviderId,
			byPassAuth: true,
		};
		const onHoldBookings = await this.bookingsRepository.search(searchQuery);
		return onHoldBookings.some((onHoldbooking) => {
			const onHoldUntil: Date = onHoldbooking.onHoldUntil;
			return onHoldbooking.status === BookingStatus.OnHold && new Date() < onHoldUntil;
		});
	}

	private async overlapsOtherAccepted(booking: Booking): Promise<boolean> {
		const searchQuery: BookingSearchQuery = {
			from: booking.startDateTime,
			to: booking.endDateTime,
			statuses: [BookingStatus.Accepted],
			serviceId: booking.serviceId,
			serviceProviderId: booking.serviceProviderId,
			byPassAuth: true,
		};

		const acceptedBookings = await this.bookingsRepository.search(searchQuery);
		return acceptedBookings.some((item) =>
			booking.bookingIntersects({
				start: item.startDateTime,
				end: item.endDateTime,
				id: item.id,
			}),
		);
	}

	protected async *validateToken(booking: Booking): AsyncIterable<BusinessValidation> {
		return;
	}
}

@InRequestScope
class SlotBookingsValidator extends BookingsValidator {
	@Inject
	private timeslotsService: TimeslotsService;

	protected async *validateAvailability(booking: Booking): AsyncIterable<BusinessValidation> {
		if (booking.serviceProviderId) {
			const isProviderAvailable = await this.timeslotsService.isProviderAvailableForTimeslot(
				booking.startDateTime,
				booking.endDateTime,
				booking.serviceId,
				booking.serviceProviderId,
				false,
			);

			if (!isProviderAvailable) {
				yield BookingBusinessValidations.ServiceProviderNotAvailable;
			}
		} else {
			const providers = await this.timeslotsService.getAvailableProvidersForTimeslot(
				booking.startDateTime,
				booking.endDateTime,
				booking.serviceId,
				false,
			);

			if (providers.length === 0) {
				yield BookingBusinessValidations.ServiceProvidersNotAvailable;
			}
		}
	}

	protected async *validateToken(booking: Booking): AsyncIterable<BusinessValidation> {
		const res = await CaptchaService.verify(booking.captchaToken, booking.captchaOrigin);
		if (!res) {
			yield BookingBusinessValidations.InvalidCaptchaToken;
		}
	}
}

@InRequestScope
export class BookingsValidatorFactory {
	@Inject
	private slotBookingValidator: SlotBookingsValidator;
	@Inject
	private outOfSlotBookingValidator: OutOfSlotBookingValidator;

	public getValidator(outOfSlotBooking: boolean): IValidator {
		if (outOfSlotBooking) {
			return this.outOfSlotBookingValidator;
		} else {
			return this.slotBookingValidator;
		}
	}
}
