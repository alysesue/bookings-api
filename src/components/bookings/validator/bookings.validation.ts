import { Booking, BookingStatus, BusinessValidation } from '../../../models';
import { Inject, InRequestScope } from 'typescript-ioc';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { BookingSearchQuery, BookingsRepository } from '../bookings.repository';
import { UnavailabilitiesService } from '../../unavailabilities/unavailabilities.service';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { isEmail, isUrl } from 'mol-lib-api-contract/utils';
import { isSGUinfin } from '../../../tools/validator';
import { concatIteratables } from '../../../tools/asyncIterables';
import { BookingBusinessValidations } from './bookingBusinessValidations';
import { CaptchaService } from '../../captcha/captcha.service';
import { MAX_PAGING_LIMIT } from '../../../core/pagedEntities';
import { IValidator, Validator } from '../../../infrastructure/validator';

@InRequestScope
abstract class BookingsValidator extends Validator<Booking> {
	@Inject
	private serviceProvidersRepository: ServiceProvidersRepository;

	private static async validateUinFin(citizenUinFin: string): Promise<boolean> {
		const validUinFin = await isSGUinfin(citizenUinFin);
		return validUinFin.pass;
	}

	private static async validateUrl(videoConferenceUrl: string): Promise<boolean> {
		return (await isUrl(videoConferenceUrl)).pass;
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
		if (booking.videoConferenceUrl && !(await BookingsValidator.validateUrl(booking.videoConferenceUrl))) {
			yield BookingBusinessValidations.VideoConferenceUrlIsInvalid;
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

		if (!this.shouldBypassCaptcha) {
			for await (const validation of this.validateToken(booking)) {
				yield validation;
				return; // stops iterable (method scoped)
			}
		}

		for await (const validation of concatIteratables(
			this.validateServiceProviderExisting(booking),
			this.validateLicenceServiceProviderIsNotExpire(booking),
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
			booking.serviceProvider = provider;
			if (!provider) {
				yield BookingBusinessValidations.ServiceProviderNotFound(booking.serviceProviderId);
			}
		}
	}

	protected async *validateLicenceServiceProviderIsNotExpire(booking: Booking): AsyncIterable<BusinessValidation> {
		if (booking.serviceProvider?.isLicenceExpire(booking.startDateTime)) {
			yield BookingBusinessValidations.ServiceProviderLicenceExpire;
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
	protected readonly ServiceProviderRequired: boolean;

	constructor(serviceProviderRequired: boolean = true) {
		super();
		this.ServiceProviderRequired = serviceProviderRequired;
	}

	protected async *validateServiceProviderExisting(booking: Booking): AsyncIterable<BusinessValidation> {
		if (this.ServiceProviderRequired && !booking.serviceProviderId) {
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
			(i) => i.startTime === booking.startDateTime.getTime() && i.endTime === booking.endDateTime.getTime(),
		);
		if (!timeslotOrBoookingExists && (await this.overlapsOtherAccepted(booking))) {
			yield BookingBusinessValidations.OverlapsAcceptedBooking;
			return; // stops iterable (method scoped)
		}

		if (!timeslotOrBoookingExists && (await this.overlapsOtherOnHoldBooking(booking))) {
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
			serviceProviderIds: booking.serviceProviderId ? [booking.serviceProviderId] : undefined,
			byPassAuth: true,
			page: 1,
			limit: MAX_PAGING_LIMIT,
		};
		let onHoldBookings = (await this.bookingsRepository.search(searchQuery)).entries;
		onHoldBookings = onHoldBookings.filter((b) => b.isValidOnHoldBooking());

		return onHoldBookings.some((item) => {
			return booking.bookingIntersects({
				start: item.startDateTime,
				end: item.endDateTime,
				id: item.id,
			});
		});
	}

	private async overlapsOtherAccepted(booking: Booking): Promise<boolean> {
		const searchQuery: BookingSearchQuery = {
			from: booking.startDateTime,
			to: booking.endDateTime,
			statuses: [BookingStatus.Accepted],
			serviceId: booking.serviceId,
			serviceProviderIds: booking.serviceProviderId ? [booking.serviceProviderId] : undefined,
			byPassAuth: true,
			page: 1,
			limit: MAX_PAGING_LIMIT,
		};

		const acceptedBookings = (await this.bookingsRepository.search(searchQuery)).entries;
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
class ConfirmOnHoldBookingValidator extends OutOfSlotBookingValidator {
	constructor() {
		super(false);
	}
}

@InRequestScope
export class BookingsValidatorFactory {
	@Inject
	private slotBookingValidator: SlotBookingsValidator;
	@Inject
	private outOfSlotBookingValidator: OutOfSlotBookingValidator;
	@Inject
	private confirmOnHoldBookingValidator: ConfirmOnHoldBookingValidator;

	public getValidator(outOfSlotBooking: boolean): IValidator<Booking> {
		if (outOfSlotBooking) {
			return this.outOfSlotBookingValidator;
		} else {
			return this.slotBookingValidator;
		}
	}

	public getOnHoldValidator(): IValidator<Booking> {
		return this.confirmOnHoldBookingValidator;
	}
}
