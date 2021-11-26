import { Inject, InRequestScope, Scope, Scoped } from 'typescript-ioc';
import { isEmail, isUrl } from 'mol-lib-api-contract/utils';
import { Booking, BookingStatus, BusinessValidation } from '../../../models';
import { ServiceProvidersRepository } from '../../serviceProviders/serviceProviders.repository';
import { BookingsRepository } from '../bookings.repository';
import { isSGUinfin } from '../../../tools/validator';
import { concatIteratables } from '../../../tools/asyncIterables';
import { CaptchaService } from '../../captcha/captcha.service';
import { Validator } from '../../../infrastructure/validator';
import { BookingBusinessValidations } from './bookingBusinessValidations';
import { ContainerContext } from '../../../infrastructure/containerContext';
import { BookingSearchRequest } from '../bookings.apicontract';
import { EventsService } from '../../events/events.service';
import { isVerifiedPhoneNumber } from '../../../tools/phoneNumber';
import { IBookingsValidator } from './bookings.validation';

abstract class BookingsEventValidator extends Validator<Booking> implements IBookingsValidator {
	@Inject
	private serviceProvidersRepository: ServiceProvidersRepository;
	@Inject
	protected bookingsRepository: BookingsRepository;
	@Inject
	protected eventService: EventsService;

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
		if (!(await BookingsEventValidator.validateUinFin(booking.citizenUinFin, booking.service.noNric))) {
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
		if (booking.videoConferenceUrl && !(await BookingsEventValidator.validateUrl(booking.videoConferenceUrl))) {
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
			booking.status === BookingStatus.OnHold
				? BookingsEventValidator.skipValidation(booking)
				: this.validateCitizenDetails(booking),
		)) {
			yieldedAny = true;
			yield validation;
		}

		if (yieldedAny) {
			return; // stops iterable (method scoped)
		}

		yield* this.validateCapacity(booking);
	}

	protected abstract validateToken(booking: Booking): AsyncIterable<BusinessValidation>;

	protected async *validateCapacity(_booking: Booking): AsyncIterable<BusinessValidation> {
		const searchQuery: BookingSearchRequest = {
			eventIds: [_booking.eventId],
			statuses: [BookingStatus.Accepted, BookingStatus.OnHold],
			page: 1,
			limit: 9999,
		};

		// decrement event bookings count if onHoldUntil has expired or
		// is validating current onhold booking (submission from standalone form)
		const eventBookings = await this.bookingsRepository.searchReturnAll(searchQuery);
		let eventBookingsCount = eventBookings.length;
		eventBookings.forEach((e) => {
			if (
				(e.status === BookingStatus.OnHold && e.onHoldUntil < new Date()) ||
				(e.id === _booking.id && e.isValidOnHoldBooking())
			) {
				eventBookingsCount = eventBookingsCount - 1;
			}
		});

		const eventDetails = await this.eventService.getById(_booking.eventId);
		eventBookingsCount = _booking.isValidOnHoldBooking() ? eventBookingsCount + 1 : eventBookingsCount;

		if (eventBookingsCount > eventDetails.capacity) {
			yield BookingBusinessValidations.EventCapacityUnavailable;
		}
	}

	protected async *validateServiceProviderExisting(booking: Booking): AsyncIterable<BusinessValidation> {
		let isValid = true;
		if (booking.bookedSlots.length > 0) {
			booking.bookedSlots.forEach(async (bookedSlot) => {
				const provider = await this.serviceProvidersRepository.getServiceProvider({
					id: bookedSlot.serviceProviderId,
				});
				bookedSlot.serviceProvider = provider;
				if (!provider) {
					isValid = isValid && false;
				}
			});
		}

		if (!isValid) {
			yield BookingBusinessValidations.ServiceProviderNotFound(booking.serviceProviderId);
		}
	}

	protected async *validateLicenceServiceProviderIsNotExpire(booking: Booking): AsyncIterable<BusinessValidation> {
		let isValid = true;
		if (booking.bookedSlots.length > 0) {
			booking.bookedSlots.forEach(async (bookedSlot) => {
				const provider = await this.serviceProvidersRepository.getServiceProvider({
					id: bookedSlot.serviceProviderId,
				});
				if (provider?.isLicenceExpire(booking.startDateTime)) {
					isValid = isValid && false;
				}
			});
		}

		if (!isValid) {
			yield BookingBusinessValidations.ServiceProviderLicenceExpire;
		}
	}
}

@Scoped(Scope.Local)
class AdminBookingEventValidator extends BookingsEventValidator {
	protected readonly ServiceProviderRequired: boolean;

	constructor(serviceProviderRequired = true) {
		super();
		this.ServiceProviderRequired = serviceProviderRequired;
	}

	protected async *validateServiceProviderExisting(booking: Booking): AsyncIterable<BusinessValidation> {
		let isValid = true;
		if (this.ServiceProviderRequired && booking.bookedSlots.length > 0) {
			booking.bookedSlots.forEach((bookedSlot) => {
				if (!bookedSlot.serviceProviderId) {
					isValid = true;
				}
			});
		}

		if (!isValid) {
			yield BookingBusinessValidations.OutOfSlotServiceProviderRequired;
			return;
		}

		yield* super.validateServiceProviderExisting(booking);
	}

	protected async *validateToken(_booking: Booking): AsyncIterable<BusinessValidation> {
		return;
	}
}

@Scoped(Scope.Local)
class CitizenBookingEventValidator extends BookingsEventValidator {
	@Inject
	private captchaService: CaptchaService;

	protected async *validateToken(booking: Booking): AsyncIterable<BusinessValidation> {
		const res = await this.captchaService.verify(booking.captchaToken);
		if (!res) {
			yield BookingBusinessValidations.InvalidCaptchaToken;
		}
	}
}

@Scoped(Scope.Local)
class ConfirmOnHoldBookingEventValidator extends AdminBookingEventValidator {
	constructor() {
		super(false);
	}
}

@InRequestScope
export class BookingsEventValidatorFactory {
	@Inject
	private containerContext: ContainerContext;

	public getValidator(useAdminValidator: boolean): IBookingsValidator {
		if (useAdminValidator) {
			return this.containerContext.resolve(AdminBookingEventValidator);
		} else {
			return this.containerContext.resolve(CitizenBookingEventValidator);
		}
	}

	public getOnHoldValidator(): IBookingsValidator {
		return this.containerContext.resolve(ConfirmOnHoldBookingEventValidator);
	}
}
