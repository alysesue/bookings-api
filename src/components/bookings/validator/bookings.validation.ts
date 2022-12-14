import { Inject, InRequestScope, Scope, Scoped } from 'typescript-ioc';
import { isEmail, isUrl } from 'mol-lib-api-contract/utils';
import { Booking, BookingStatus, BusinessValidation } from '../../../models';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { DateHelper } from '../../../infrastructure/dateHelper';
import { BookingSearchQuery, BookingsRepository } from '../bookings.repository';
import { UnavailabilitiesService } from '../../unavailabilities/unavailabilities.service';
import { TimeslotsService } from '../../timeslots/timeslots.service';
import { isSGUinfin } from '../../../tools/validator';
import { concatIteratables } from '../../../tools/asyncIterables';
import { CaptchaService } from '../../captcha/captcha.service';
import { MAX_PAGING_LIMIT } from '../../../core/pagedEntities';
import { IValidator, Validator } from '../../../infrastructure/validator';
import { BookingBusinessValidations } from './bookingBusinessValidations';
import { ContainerContext } from '../../../infrastructure/containerContext';
import { isVerifiedPhoneNumber } from '../../../tools/phoneNumber';
import { CitizenAuthenticationType } from '../../../models/citizenAuthenticationType';

export interface IBookingsValidator extends IValidator<Booking> {
	bypassCaptcha(shouldBypassCaptcha: boolean): void;
	addCustomCitizenValidations(...customValidations: BusinessValidation[]);
}

abstract class BookingsValidator extends Validator<Booking> implements IBookingsValidator {
	@Inject
	private serviceProvidersRepository: ServiceProvidersRepository;

	protected shouldBypassCaptcha = false;
	private _customCitizenValidations: BusinessValidation[];

	constructor() {
		super();
		this._customCitizenValidations = [];
	}

	public bypassCaptcha(shouldBypassCaptcha: boolean) {
		this.shouldBypassCaptcha = shouldBypassCaptcha;
	}

	public addCustomCitizenValidations(...customValidations: BusinessValidation[]) {
		this._customCitizenValidations.push(...customValidations);
	}

	private static async validateUinFin(citizenUinFin: string, noNric?: boolean): Promise<boolean> {
		if (noNric && !citizenUinFin) {
			return true;
		}
		const validUinFin = await isSGUinfin(citizenUinFin);
		return validUinFin.pass;
	}

	private static async validateUrl(videoConferenceUrl: string): Promise<boolean> {
		return (await isUrl(videoConferenceUrl)).pass;
	}

	private async *validateCitizenDetails(booking: Booking): AsyncIterable<BusinessValidation> {
		if (
			booking.citizenUinFin &&
			!(await BookingsValidator.validateUinFin(booking.citizenUinFin, booking.service.noNric))
		) {
			yield BookingBusinessValidations.CitizenUinFinNotFound;
		}
		if (!booking.citizenName) {
			yield BookingBusinessValidations.CitizenNameNotProvided;
		} else {
			const nameWithWhiteSpaceRemoved = booking.citizenName.trim();
			const regex = /^[^-\s]{1}[a-zA-Z0-9_,'\s-/@().]+$/;
			if (!regex.test(String(nameWithWhiteSpaceRemoved).toLowerCase())) {
				yield BookingBusinessValidations.CitizenNameNotValid;
			}
		}
		if (!booking.citizenEmail) {
			yield BookingBusinessValidations.CitizenEmailNotProvided;
		} else if (!(await isEmail(booking.citizenEmail)).pass) {
			yield BookingBusinessValidations.CitizenEmailNotValid;
		}
		if (booking.videoConferenceUrl && !(await BookingsValidator.validateUrl(booking.videoConferenceUrl))) {
			yield BookingBusinessValidations.VideoConferenceUrlIsInvalid;
		}
		if (booking.citizenPhone) {
			if (!isVerifiedPhoneNumber(booking.citizenPhone)) {
				yield BookingBusinessValidations.PhoneNumberNotValid;
			}
		}
		if (booking.service.hasSalutation && !booking.citizenSalutation) {
			yield BookingBusinessValidations.CitizenSalutationNotProvided;
		}

		if (this._customCitizenValidations.length > 0) {
			yield* this._customCitizenValidations;
		}

		yield* this.validateByAuthorizationType(booking);
	}

	private static async *validateDuration(booking: Booking): AsyncIterable<BusinessValidation> {
		const duration = Math.floor(DateHelper.DiffInMinutes(booking.endDateTime, booking.startDateTime));

		if (duration <= 0) {
			yield BookingBusinessValidations.EndTimeLesserThanStartTime;
		}
	}

	private static async *skipValidation(_booking: Booking): AsyncIterable<BusinessValidation> {
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
				: this.validateCitizenDetails(booking),
			// this.validateByAuthorizationType(booking),
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

	protected abstract validateByAuthorizationType(booking: Booking): AsyncIterable<BusinessValidation>;

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

@Scoped(Scope.Local)
class AdminBookingValidator extends BookingsValidator {
	@Inject
	private bookingsRepository: BookingsRepository;
	@Inject
	private unAvailabilitiesService: UnavailabilitiesService;
	@Inject
	private timeslotsService: TimeslotsService;

	protected readonly ServiceProviderRequired: boolean;

	constructor(serviceProviderRequired = true) {
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
		const existingTimeslot = await this.timeslotsService.getAggregatedTimeslots({
			startDateTime: booking.startDateTime,
			endDateTime: booking.endDateTime,
			serviceId: booking.serviceId,
			includeBookings: true,
			serviceProviderIds: booking.serviceProviderId ? [booking.serviceProviderId] : undefined,
			filterDaysInAdvance: false,
		});

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

	protected async *validateToken(_booking: Booking): AsyncIterable<BusinessValidation> {
		return;
	}

	protected async *validateByAuthorizationType(booking: Booking): AsyncIterable<BusinessValidation> {
		const authType = booking.citizenAuthType;
		switch (authType) {
			case CitizenAuthenticationType.Singpass:
				if (!booking.citizenUinFin) yield BookingBusinessValidations.CitizenUinFinNotProvided;
				return;
			case CitizenAuthenticationType.Otp:
				if (!booking.citizenPhone) yield BookingBusinessValidations.PhoneNumberNotProvided;
				return;
			default:
				return;
		}
	}
}

@Scoped(Scope.Local)
class CitizenBookingValidator extends BookingsValidator {
	@Inject
	private timeslotsService: TimeslotsService;
	@Inject
	private captchaService: CaptchaService;

	protected async *validateAvailability(booking: Booking): AsyncIterable<BusinessValidation> {
		if (booking.serviceProviderId) {
			const isProviderAvailable = await this.timeslotsService.isProviderAvailableForTimeslot({
				startDateTime: booking.startDateTime,
				endDateTime: booking.endDateTime,
				serviceId: booking.serviceId,
				serviceProviderId: booking.serviceProviderId,
				skipUnassigned: false,
				filterDaysInAdvance: true,
			});

			if (!isProviderAvailable) {
				yield BookingBusinessValidations.ServiceProviderNotAvailable;
			}
		} else {
			const providers = await this.timeslotsService.getAvailableProvidersForTimeslot({
				startDateTime: booking.startDateTime,
				endDateTime: booking.endDateTime,
				serviceId: booking.serviceId,
				skipUnassigned: false,
				filterDaysInAdvance: true,
			});

			if (providers.length === 0) {
				yield BookingBusinessValidations.ServiceProvidersNotAvailable;
			}
		}
	}

	protected async *validateToken(booking: Booking): AsyncIterable<BusinessValidation> {
		const res = await this.captchaService.verify(booking.captchaToken);
		if (!res) {
			yield BookingBusinessValidations.InvalidCaptchaToken;
		}
	}

	protected async *validateByAuthorizationType(booking: Booking): AsyncIterable<BusinessValidation> {
		const noNric = booking.service.noNric;
		if (!noNric && !booking.citizenUinFin) {
			yield BookingBusinessValidations.CitizenUinFinNotProvided;
		}
	}
}

@Scoped(Scope.Local)
class ConfirmOnHoldBookingValidator extends AdminBookingValidator {
	constructor() {
		super(false);
	}

	protected async *validateByAuthorizationType(booking: Booking): AsyncIterable<BusinessValidation> {
		const noNric = booking.service.noNric;
		if (!noNric && !booking.citizenUinFin) {
			yield BookingBusinessValidations.CitizenUinFinNotProvided;
		}
	}
}

@InRequestScope
export class BookingsValidatorFactory {
	@Inject
	private containerContext: ContainerContext;

	public getValidator(useAdminValidator: boolean): IBookingsValidator {
		if (useAdminValidator) {
			return this.containerContext.resolve(AdminBookingValidator);
		} else {
			return this.containerContext.resolve(CitizenBookingValidator);
		}
	}

	public getOnHoldValidator(): IBookingsValidator {
		return this.containerContext.resolve(ConfirmOnHoldBookingValidator);
	}
}
